# Strapi MCP server (built-in) — optional product capability

Strapi **v5.47+** ships a **built-in MCP server** that lets AI clients (Claude Desktop / Code, Cursor, Windsurf, etc.) manage content in natural language — create / read / update / delete / publish, with full permission enforcement. Consider it in **stage 4** when the product needs AI agents (or AI-powered features) to act on Strapi content.

- Feature docs: https://docs.strapi.io/cms/features/strapi-mcp-server
- Extending it with custom tools (plugin walkthrough): https://strapi.io/blog/how-to-extend-strapi-s-mcp-server-with-a-custom-tools-via-a-plugin

> **GA, opt-in, Strapi ≥ 5.47.0.** Shipped beta in 5.47 and went **GA in 5.49.0** — it's production-ready (verified against the docs 2026-07-20, which list it as a standard free feature with no beta label). Off by default: recommend it only when the product has a real "let an AI agent manage content" need — don't enable it speculatively. Known limitations below still apply; re-verify against the docs before writing it into a spec.

## Don't confuse the two "MCP" things
- **`strapi-docs` MCP** — a *docs-lookup* tool **Claude uses while building** (see `docs-lookup.md`). Nothing to do with the product being built.
- **Strapi MCP server (this file)** — a *runtime feature of the built product* that exposes its content over MCP. This is a **stage-4 product decision**.

## When to include it
- The product's value involves AI agents reading/writing its content (assistants, copilots, automation over the CMS).
- The team wants to drive content operations from Claude / Cursor / etc.
- **Skip it** for a plain website/app with no agent or AI-content story.

## Enable & configure
In `config/server.ts` (or `config/server.js`):

```ts
export default ({ env }) => ({
  // ...existing server config
  mcp: {
    enabled: true,
    // connectTimeoutMs: 5000,   // optional (default 5000)
    // requestTimeoutMs: 60000,  // optional (default 60000)
  },
})
```

- **Endpoint**: `POST /mcp` (only POST; GET/DELETE return `405`). Local: `http://localhost:1337/mcp`.
- **Auth (verified on v5.51)**: an **Admin Token** (`kind: 'admin'`), sent as `Authorization: Bearer <accessKey>`. ⚠️ A classic content-API token (Settings → API Tokens) is **rejected** with JSON-RPC `-32000 "Authentication required"` even though it works on `/api/*`. Create via `POST /admin/admin-tokens` with `adminPermissions` from the **admin RBAC registry** — content-api action strings are rejected: `{ "name": "reporting", "lifespan": null, "adminPermissions": [{ "action": "plugin::content-manager.explorer.read", "subject": "api::article.article" }] }`.
- **Least privilege**: create a **scoped token per use case** with only the permissions it needs — tool visibility, fields, and locales are all filtered by the token's permissions (a read-only token sees only `list_*`/`get_*` tools for its subjects).

## What it exposes (per content type, permission-gated)
- **Collection types**: `list`, `get`, `create`, `update`, `delete`, `publish`, `unpublish`, `discard_draft`.
- **Single types**: `get`, `write` (merged create/update), `publish`, `unpublish`, `discard_draft`.
- Supports filtering / sorting / pagination on `list`, relation `connect`/`disconnect`/`set`, i18n locales, and the draft & publish workflow.
- Dev-mode utility: a `log` tool.

## Extending with custom tools
Register custom MCP tools from a Strapi **plugin** via the `strapi.ai.mcp` service — use this when the agent needs domain actions beyond CRUD (e.g. "approve order", "recompute totals"). Walkthrough in the blog linked above. Scaffold the plugin shell with `npx @strapi/sdk-plugin init` (plugin SDK docs: https://docs.strapi.io/cms/plugins-development/plugin-sdk · CLI repo: https://github.com/strapi/sdk-plugin — interactive-only; for the canonical structure a build agent can write directly, see the plugin-structure entry in `strapi-build-cookbook.md`). Register tools in the plugin `register()` phase — `strapi.ai.mcp.registerTool(...)` must run **before** the MCP server starts (`mcp.start()`).

**Verified contract (v5.51)** — `registerTool` takes ONE object; positional `('name', {...})` fails with *tool with name "undefined" must declare auth policies*:
```js
const { z } = require('@strapi/utils')
strapi.ai.mcp.registerTool({
  name: 'approve-order',
  title: 'Approve order',
  description: '…',
  auth: { policies: [{ action: 'plugin::content-manager.explorer.update', subject: 'api::order.order' }] }, // or devModeOnly: true
  resolveInputSchema: () => z.object({ orderId: z.string() }),
  resolveOutputSchema: () => z.object({ result: z.any() }),        // MANDATORY — omitting it throws
  createHandler: (strapi, ctx) => async ({ args }) => ({
    content: [{ type: 'text', text: '…' }],
    structuredContent: { result: '…' },                            // must match resolveOutputSchema
  }),
})
```
Auth policies are CASL checks against the presenting token's ability — the gate passes when **any** policy matches. See the matching entry in `strapi-build-cookbook.md`.

## ⚠️ The built-in CRUD tools are a data-loss hazard for agents — prefer purpose-built tools
**Field-verified 2026-07-28** (a real Claude Desktop session against a production Strapi 5.51, working a live queue): the auto-generated content-manager tools cost a **1,200-word post, silently overwritten**. The agent wanted to set one 400-character field; `update_<type>` applies the **create** schema's `required` array, so it demanded the full `content` back, the agent sent a truncated copy, and nothing warned anyone — no diff, no confirmation, discoverable only by re-reading. Other findings from the same session, worth designing around:
- **Enum/`$null` filters are rejected** — the generated schema types `$notNull` as the field's own type instead of boolean, so "find records missing X" is expressible but not accepted.
- **Context economy**: big JSON fields (raw payloads) ship on every record with no field selection, and the fully-expanded filter schema (every field × every operator, inline) can cost more than the data being queried. A `pageSize=25` fetch shouldn't consume a meaningful slice of the window.
- **Relations return as bare `documentId`s** — unusable without a second call.
- **Discovery is weak**: auto-generated descriptions ("Content-manager list for api::x.x") carry no semantic signal, so tool search misses on anything but the bare noun.

**Design rule:** if agents will do real work in the product, **write domain tools and scope their tokens to those tools only.** A token holding `content-manager.explorer.*` gets the generic CRUD tools *in addition to* yours — which is exactly how the overwrite happened. Purpose-built tools that fixed each item above:
- **Partial updates by construction** — an update tool takes only the fields it may change, and simply **doesn't expose immutable ones** (`content` unwritable ⇒ the corruption path cannot exist).
- **Semantic filters instead of raw operators** — `draft: 'no-draft' | 'has-draft'`, `status`, `sentiment`, `topic`, `search`. No operator schema for the model to get wrong, no `$null`-on-enum problem, a fraction of the schema size.
- **Trimmed, paged results** — `page`/`limit`/`total`/`hasMore`, an `excerptChars` knob for long text, relations as **names**, raw payloads never in tool output.
- **Bulk + conditional writes** — one call for N records, and refuse to overwrite an existing value unless `overwrite: true` (so a re-run can't clobber human edits).
- **Hand-written descriptions** stating what the tool is for and when to reach for it.

### Guard result size — the payload rides the wire TWICE
MCP clients reject a result over ~1 MB with an opaque *"Tool result is too large"* the agent can't act on. The result is serialized **twice** (`content` text **and** `structuredContent`), so measure the doubled size and return a structured, actionable notice instead:
```ts
const bytes = Buffer.byteLength(JSON.stringify(data), 'utf8')
const wireBytes = bytes * 2 + 2048
const payload = wireBytes > 950_000
  ? { error: 'RESULT_TOO_LARGE', bytes: wireBytes, message: `~${(wireBytes/1e6).toFixed(2)} MB on the wire (sent twice). ${shrinkHint}` }
  : data
```
Give each tool a **shrink hint** naming its own paging/field knobs — the agent can then recover on its own instead of failing.

### Permissions for custom tools: one action per tool, registered in `register()`
Give every tool its **own** admin permission action so tokens are gated per tool from the admin UI (checkbox per tool), rather than reusing content-manager permissions (which drags the generic CRUD tools along):
```ts
// register() — NOT bootstrap(): admin's bootstrap prunes grants for unknown actions,
// so bootstrap-time registration silently wipes token checkboxes on every restart.
await strapi.service('admin::permission').actionProvider.registerMany(
  TOOLS.map((t) => ({ section: 'settings', category: 'Pulse MCP tools', uid: `pulse-mcp.${t.name}`, displayName: t.title }))
)
// then: auth: { policies: [{ action: `api::pulse-mcp.${t.name}` }] }
```
See the admin-permissions entry in `strapi-build-cookbook.md` for the section/`pluginName` → tab/action-id mapping.

### One registry, two surfaces
Define each tool **once** (name, description, zod schema, handler) in a plain module, then have both the MCP server and any in-app AI assistant consume it — `z.toJSONSchema()` converts the same schema for the Anthropic Messages API tool-use loop. The alternative (tools defined per surface) drifts within a week, and the in-app chat ends up weaker than the external agent for no reason.

## Known limitations (GA, but these still apply)
- **Cannot upload new media** — can only reference existing files.
- Dynamic zones come through as untyped arrays; no nested population params for relations.
- Custom fields fall back to their underlying Strapi types; circular component refs resolve to generic objects.
- **Stateless** — each request spins an ephemeral server instance (no session persistence).

## Specifying it (stages 5–6, only if enabled)
Record: `mcp.enabled` in `config/server`, which content types/actions are exposed, the scoped-token strategy, any custom tools (plugin + `strapi.ai.mcp` registrations), and the known limitations above.

# Strapi MCP server (built-in) — optional product capability

Strapi **v5.47+** ships a **built-in MCP server** that lets AI clients (Claude Desktop / Code, Cursor, Windsurf, etc.) manage content in natural language — create / read / update / delete / publish, with full permission enforcement. Consider it in **stage 4** when the product needs AI agents (or AI-powered features) to act on Strapi content.

- Feature docs: https://docs.strapi.io/cms/features/strapi-mcp-server
- Extending it with custom tools (plugin walkthrough): https://strapi.io/blog/how-to-extend-strapi-s-mcp-server-with-a-custom-tools-via-a-plugin

> ⚠️ **Beta, opt-in, Strapi ≥ 5.47.0.** Off by default. Recommend it only when the product has a real "let an AI agent manage content" need — don't enable it speculatively. The surface is new; re-verify against the docs before writing it into a spec.

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
- **Auth**: an **Admin API token** (Settings → API Tokens → Create), sent as `Authorization: Bearer <token>`.
- **Least privilege**: create a **scoped token per use case** with only the permissions it needs — tool visibility, fields, and locales are all filtered by the token's permissions.

## What it exposes (per content type, permission-gated)
- **Collection types**: `list`, `get`, `create`, `update`, `delete`, `publish`, `unpublish`, `discard_draft`.
- **Single types**: `get`, `write` (merged create/update), `publish`, `unpublish`, `discard_draft`.
- Supports filtering / sorting / pagination on `list`, relation `connect`/`disconnect`/`set`, i18n locales, and the draft & publish workflow.
- Dev-mode utility: a `log` tool.

## Extending with custom tools
Register custom MCP tools from a Strapi **plugin** via the `strapi.ai.mcp` service — use this when the agent needs domain actions beyond CRUD (e.g. "approve order", "recompute totals"). Walkthrough in the blog linked above. In Claude Code, the plugin-scaffolding patterns (e.g. the `strapi-custom-field` companion's `@strapi/sdk-plugin` flow) help create the plugin shell.

## Caveats (beta)
- **Cannot upload new media** — can only reference existing files.
- Dynamic zones come through as untyped arrays; no nested population params for relations.
- Custom fields fall back to their underlying Strapi types; circular component refs resolve to generic objects.
- **Stateless** — each request spins an ephemeral server instance (no session persistence).

## Specifying it (stages 5–6, only if enabled)
Record: `mcp.enabled` in `config/server`, which content types/actions are exposed, the scoped-token strategy, any custom tools (plugin + `strapi.ai.mcp` registrations), and the beta caveats above.

---
name: strapi-mcp-capabilities
description: Create custom MCP capabilities (tools, prompts, resources) in a Strapi 5 plugin via the strapi.ai.mcp service. Use when adding a custom MCP tool/prompt/resource to Strapi, extending the Strapi MCP server.
---

# Strapi MCP Capabilities

Register custom MCP tools/prompts/resources so AI clients can trigger plugin-specific actions on a running Strapi instance. Strapi 5.47.0+. API source of truth: `@strapi/types`, search `mcp`.

## Hard rules

1. **Enable the server**: `config/server.ts` must set `mcp: { enabled: true }`. Endpoint is `POST /mcp`.
2. **Register only in the `register()` phase.** The capability list is locked once the MCP server starts (during bootstrap). Registering later throws.
3. **Use Zod from `@strapi/utils`** (`import { z } from '@strapi/utils'`), not standalone `zod`.
4. **Never use global `strapi` at module top-level.** Either register inline (have `strapi`) or use `ai.mcp.defineTool(...)` to define at module scope, then register with the injected `strapi`.

## Two registration patterns

**Inline** — when `strapi` is in scope (a function called from `register()`):

```ts
// mcp/tools/get-store-kpis.ts
import type { Core } from '@strapi/strapi';
import { z } from '@strapi/utils';

export const registerGetStoreKpisTool = (strapi: Core.Strapi) => {
  strapi.ai.mcp.registerTool({ /* definition */ });
};
```

**Builder** — define at module scope (no `strapi`), register later. `defineTool` is an identity helper that narrows the access variant for type inference:

```ts
// mcp/tools/get-top-products.ts
import { ai } from '@strapi/strapi';
import { z } from '@strapi/utils';

export const getTopProductsTool = ai.mcp.defineTool({ /* definition */ });

// register.ts
strapi.ai.mcp.registerTool(getTopProductsTool);
```

Wire both from the plugin `register()`:

```ts
// register.ts
export const register = ({ strapi }: { strapi: Core.Strapi }) => {
  registerGetStoreKpisTool(strapi);          // inline
  strapi.ai.mcp.registerTool(getTopProductsTool); // builder
};
```

## Tool definition (the core unit)

```ts
strapi.ai.mcp.registerTool({
  name: 'get_store_kpis',          // snake_case, unique
  title: 'Get Store KPIs',
  description: 'What it returns + when to use it. The AI reads this to choose the tool.',
  auth: { policies: [{ action: 'plugin::store-analytics.read' }] }, // OR devModeOnly: true
  resolveInputSchema: () => inputSchema,   // optional; omit if no args
  resolveOutputSchema: () => outputSchema, // required; a z.object
  createHandler: (strapi, context) => async ({ args, extra }) => {
    const result = await strapi
      .plugin('store-analytics')
      .service('analytics')
      .getStoreKpis(args);

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result, // must match resolveOutputSchema
    };
  },
});
```

Key points:
- `createHandler(strapi, context) => handler`. The handler receives a single object `{ args, extra }`. `args` is `z.infer<inputSchema>` (typed); if no `resolveInputSchema`, omit `args`.
- `context: { userAbility, user }` — use `userAbility` for entity/field permission checks and `user` (token owner) for `setCreatorFields` on writes.
- Keep handlers thin: delegate to a plugin **service**; the tool is just the MCP surface.
- `name`/`title`/`description`/`resolveOutputSchema` are required. `description` quality drives AI tool selection — state what it returns and when to use it.

## Schemas

- Define `z.object` input/output schemas; reuse shared field schemas (e.g. an `isoDateSchema` with `.describe(...)`).
- `.describe()` every non-obvious field — descriptions reach the AI client.
- `structuredContent` returned by the handler must satisfy `resolveOutputSchema`.

## Auth (choose exactly one access variant)

- `auth: { policies: [{ action, subject? }] }` — CASL check; session passes if the token's ability satisfies **any** policy. `action` is typically a registered admin permission, e.g. `plugin::<plugin-id>.<permission>`.
- `devModeOnly: true` — no auth; only available when `autoReload` is on (dev). Use for debug tools.

For `auth` to be grantable to a token, register the permission action in `bootstrap()`:

```ts
await strapi.service('admin::permission').actionProvider.registerMany([
  { section: 'plugins', displayName: 'Access store analytics',
    uid: 'read', pluginName: 'store-analytics' },
]);
// → action becomes 'plugin::store-analytics.read'
```

## Handler return shape

```ts
// success
return { content: [{ type: 'text', text }], structuredContent: result };
// error
return { content: [{ type: 'text', text: 'message' }], isError: true };
```
`structuredContent` and `isError` are mutually exclusive.

## Folder convention

```
server/src/
├── register.ts            # calls registrations (register phase only)
├── bootstrap.ts           # registerMany permission actions
├── mcp/
│   ├── index.ts           # registerAllMcpTools(strapi)
│   ├── schemas.ts         # shared zod field schemas
│   └── tools/<tool>.ts    # one capability per file
└── services/              # business logic the handlers call
```

## Verify

1. `mcp: { enabled: true }` in `config/server.ts`; restart Strapi.
2. Connect a client to `http://localhost:1337/mcp` with `Authorization: Bearer <admin-token>` whose permissions include the tool's `auth` action.
3. Confirm the tool appears and returns `structuredContent` matching its output schema.

## Prompts & resources

Same lifecycle/auth rules, different builders: `ai.mcp.definePrompt` / `strapi.ai.mcp.registerPrompt` and `ai.mcp.defineResource` / `strapi.ai.mcp.registerResource`. See [reference.md](reference.md) for their field tables and signatures.

## Docs

- [MCP server](https://docs.strapi.io/cms/features/strapi-mcp-server) (config, permission boundaries, stateless architecture, limitations)
- API types: `@strapi/types`

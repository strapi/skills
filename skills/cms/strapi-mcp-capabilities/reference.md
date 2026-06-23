# MCP capabilities — full reference

Types: `@strapi/types/dist/modules/mcp.d.ts` (`Modules.MCP.*`). Service: `strapi.ai.mcp` (`McpService`).

## Service surface (`strapi.ai.mcp`)

| Method | Notes |
| --- | --- |
| `isEnabled()` | MCP enabled in config |
| `isRunning()` | server started (registration locked) |
| `registerTool(def)` | register phase only; throws after start |
| `registerPrompt(def)` | register phase only |
| `registerResource(def)` | register phase only |
| `start()` / `stop()` | managed by Strapi; don't call manually |

Builders on `ai.mcp`: `defineTool`, `definePrompt`, `defineResource` — identity helpers that narrow the access variant (`devModeOnly` vs `auth`) for type inference. Define at module scope, register when `strapi` is available.

## Access variant (every capability)

Exactly one of:
- `{ auth: { policies: [{ action: string; subject?: string }, ...] } }` — passes if user ability satisfies ANY policy.
- `{ devModeOnly: true }` — dev only (`autoReload`), no auth.

Optional on any capability: `telemetry?: { source?: string; name?: string }` (`name` sanitizes the analytics label).

## Tool

```ts
{
  name: string;
  title: string;
  description: string;
  resolveInputSchema?: (ctx: McpHandlerContext) => z.ZodObject;  // optional
  resolveOutputSchema: (ctx: McpHandlerContext) => z.ZodObject;  // required
  createHandler: (strapi, ctx: McpHandlerContext) =>
    (params: { args; extra }) => Promise<ToolReturn>;
} & AccessVariant
```

- `McpHandlerContext = { userAbility: Ability; user: { id: string | number } }`.
- Handler `args` = `z.infer<inputSchema>`; omit `args` when no input schema.
- `extra: RequestHandlerExtra` (MCP SDK request metadata).
- Return: `{ content: ContentBlock[]; structuredContent: z.infer<outputSchema> }` OR `{ content: ContentBlock[]; isError: true }`.
- Schema resolvers receive `ctx`, so input/output can be narrowed per user ability.

## Prompt

```ts
{
  name: string;
  title: string;
  description: string;
  argsSchema?: z.ZodObject;            // note: a schema, not a resolver
  createHandler: (strapi) => McpPromptCallback;
} & AccessVariant
```

- With `argsSchema`: callback is `(args, extra) => Promise<GetPromptResult>`.
- Without: callback is `(extra) => Promise<GetPromptResult>`.

## Resource

```ts
{
  name: string;
  uri: string;
  metadata: ResourceMetadata;          // from MCP SDK
  createHandler: (strapi) => (uri: URL, extra) => Promise<ReadResourceResult>;
} & AccessVariant
```

## Built-in reference behaviors (content-type tools)

Strapi auto-generates CRUD/draft-publish tools per content type, gated by the admin token's permissions (tool visibility, field filtering, locale filtering, runtime checks). Custom capabilities live alongside these. Built-in `log` tool is dev-only. See the [MCP server docs](https://docs.strapi.io/cms/features/strapi-mcp-server).

## Gotchas

- Registration order: core `register()` → plugin `register()` → MCP server starts → `bootstrap()`. Register capabilities in a `register()` hook; services are reachable from handlers regardless.
- `import { z } from '@strapi/utils'` (not `zod`) for schema compatibility.
- `structuredContent` must validate against `resolveOutputSchema` or the response is rejected.
- For an `auth.action` to be assignable to a token, register it as an admin permission action in `bootstrap()` via `admin::permission` `actionProvider.registerMany`.

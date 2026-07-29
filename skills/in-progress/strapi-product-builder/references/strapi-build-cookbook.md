# Strapi v5 build cookbook — the non-obvious traps

This skill produces a *spec*; the build session generates most code itself from the spec + the official docs. This file captures only the **v5 pitfalls a build session gets wrong by default** — each with the fix and a docs link. Don't expand it into boilerplate Claude can write; look up everything else in the docs.

> Source of truth: https://docs.strapi.io (or the `strapi-docs` MCP). Re-verify at build time — Strapi's APIs move.

## Scaffold
`npx create-strapi-app@latest <dir>` — TypeScript is the default; `--quickstart` is deprecated and conflicts with `--dbclient`. Non-interactive: add `--skip-cloud --dbclient=postgres --dbhost=… --dbport=… --dbname=… --dbusername=… --dbpassword=…` (SQLite for local-only). For a *truly* non-interactive run also pass `--non-interactive --no-example --no-git-init` — the `--db*` flags alone still prompt. The scaffold may not generate `JWT_SECRET` (Users & Permissions needs it) or set `DATABASE_FILENAME` for SQLite — add both to `.env`.

## Set a server-only field on create (e.g. `owner` = current user)
**Trap:** mutating `ctx.request.body.data.owner` then `super.create(ctx)` → **400 "Invalid key owner"** (v5 re-validates the body against user-writable fields and rejects private relations).
**Fix:** create via the **Document Service** (bypasses input validation), then sanitize:
```ts
// src/api/product/controllers/product.ts
import { factories } from '@strapi/strapi'
export default factories.createCoreController('api::product.product', ({ strapi }) => ({
  async create(ctx) {
    const data = (await this.sanitizeInput(ctx.request.body.data, ctx)) as Record<string, any>
    const entry = await strapi.documents('api::product.product').create({
      data: { ...data, owner: ctx.state.user.id } as any,
    })
    return this.transformResponse(await this.sanitizeOutput(entry, ctx))
  },
}))
```
> **TS strict build:** the casts above are required in a default (TypeScript) Strapi project — `sanitizeInput` returns a union (raw spread → `TS2698`) and the Document Service `data` param is strictly typed, so the dev server won't compile without them. Drop the casts in a JS project.

Docs: Document Service https://docs.strapi.io/cms/api/document-service · Controllers https://docs.strapi.io/cms/backend-customization/controllers

## Owner-scoped reads ("only my orders")
**Trap:** `ctx.query.filters = { buyer: {...} }` then `super.find` → **400** (query sanitizer rejects filtering on a private relation).
**Fix:** query the Document Service server-side, then sanitize:
```ts
async find(ctx) {
  const entries = await strapi.documents('api::order.order').findMany({
    filters: { buyer: { id: ctx.state.user.id } },
    populate: { items: true },
  })
  return this.transformResponse(await this.sanitizeOutput(entries, ctx))
}
```

## Per-record ownership (`is-owner` policy)
A global policy loads the record and compares its owner to `ctx.state.user.id`; apply it on `update`/`delete` in the route config. Docs: https://docs.strapi.io/cms/backend-customization/policies

## Where does logic go? (v5 layering — lifecycle hooks are NOT the default anymore)
Pick the layer by the context the logic needs:
- **Needs the request/auth user** (stamp `owner`/`author` = current user, auth checks) → **controller only.** Lifecycle hooks and Document Service middleware have **no request / `ctx.state.user` access** — so "stamp author from session in `beforeCreate`" cannot work.
- **Document-level logic, no request** (slug generation, derived fields, cross-type transforms, notifications) → **Document Service middleware**, registered in `register()`:
  ```ts
  // src/index.ts → register({ strapi })
  strapi.documents.use(async (ctx, next) => {
    if (ctx.uid === 'api::trail.trail' && ctx.action === 'create')
      ctx.params.data.slug ??= slugify(ctx.params.data.title)
    return next()            // always return next()
  })
  ```
- **Lifecycle hooks** (`beforeCreate`, …) → **avoid for business logic in v5.** They fire at the DB layer (no request context) and fire **twice** when publishing (draft + published version). Reserve for low-level DB constraints.

Refs (official Strapi blog, see `resources.md`): *What are Document Service Middleware, and What Happened to Lifecycle Hooks?* · *When To Use Lifecycle Hooks in Strapi* · *How To Use Register Function To Customize Your Strapi App*.

## Authorization gates (plan limits, quotas, role checks) → route policy
For a per-request **allow/deny → 403** (free-plan limit, quota, role gate), use a **route policy** (`config: { policies: ['global::is-within-plan'] }`) that returns `false`. It runs after auth, before the controller, so owner-stamping stays in the controller. This is the *authorization* layer — distinct from the controller / Document-Service-middleware / lifecycle split above. Docs: https://docs.strapi.io/cms/backend-customization/policies
> **TS caveat:** `Core.Policy` types `ctx` without `.state`/`.params` and forbids an async return — a realistic async policy won't compile against it. Type the handler yourself (or `any`), same as the `sanitizeInput` cast above.

## Seed end-user accounts that can actually log in
**Trap:** `strapi.query('plugin::users-permissions.user').create({ data: { password } })` stores the password **unhashed** → login fails (hashing lives in the U&P flow, not `query`/`entityService`).
**Fix:** create users through the U&P user service (or the `/api/auth/local/register` flow) so the password hashes. Docs: https://docs.strapi.io/cms/features/users-permissions

## Seed BOTH roles
**Trap:** a fresh Strapi denies every content-API action for **both** roles — being logged in grants nothing. Seeding only Public `find`/`findOne` makes the app *look* done (public pages render), then every signed-in write 403s — and that 403 reads as an auth/JWT bug, not the missing Authenticated permissions it actually is. Clicking permissions on in the admin UI doesn't survive a fresh deploy/DB — seed them in the script.
**Fix:** each permission is its own record. Look the roles up by `type`, then create one `plugin::users-permissions.permission` entry per action per role:

```ts
const pub = await strapi.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } })
const auth = await strapi.query('plugin::users-permissions.role').findOne({ where: { type: 'authenticated' } })
for (const action of ['api::report.report.find', 'api::report.report.findOne'])
  await strapi.query('plugin::users-permissions.permission').create({ data: { action, role: pub.id } })
for (const action of ['api::report.report.create', 'api::report.report.update', 'api::report.report.delete'])
  await strapi.query('plugin::users-permissions.permission').create({ data: { action, role: auth.id } })
```

Action strings are `api::<api>.<content-type>.<find|findOne|create|update|delete>` (custom routes get their own action per the route's `handler`). Public gets reads on public content; Authenticated gets `create`/`update`/`delete` on user-owned content — an ownership app is unusable if only Public is seeded.

## Extending a plugin content type (e.g. the U&P `user`) = full replace, NOT merge
**Trap:** a `src/extensions/users-permissions/content-types/user/schema.json` containing only your *added* attributes is treated as the **complete** schema — Strapi drops the base fields (`email`, `username`, `password`, `role`), the DB ends up without those columns (`no such column: t0.email`), and auth + seeding crash (DB-corrupting). **Fix:** the extension file must reproduce the **entire** base user schema **plus** your additions. (Verified on v5.48 — copy the base schema from `node_modules/@strapi/plugin-users-permissions`.)

## Webhooks / unauthenticated third-party callbacks (e.g. Stripe)
- **Raw body for signature verification:** `strapi::body` parses the body, but signature checks (e.g. `stripe.webhooks.constructEvent`) need the **raw bytes**. In `config/middlewares.ts` use `{ name: 'strapi::body', config: { includeUnparsed: true } }`, then read the raw string from **`ctx.request.body[Symbol.for('unparsedBody')]`**. (A named `unparsed` import from `koa-body` does **not** exist — use the symbol. Not in the official middleware docs; verified empirically.)
- **Public route:** make the webhook reachable with no JWT via **`config: { auth: false }`** on the route (not a Public-role permission).
- **Carry identity:** pass the Strapi user id in Stripe's `client_reference_id`/`metadata` at checkout so the webhook knows whom to update.

## User-data exposure: `/api/users/me` only — never seed `user.find`
**Trap:** seeding U&P's `user.find`/`findOne` (or clicking them on) lets ANY authenticated user — or any leaked JWT — enumerate every account's email via `GET /api/users`. Teams do it reflexively because a UI needs "assignee pickers" or "claimed by X" labels.
**Fix (verified on v5.51):** the only user permission the Authenticated role gets is **`plugin::users-permissions.user.me`** — the frontend reads the current user from `GET /api/users/me`, and `/api/users` 403s for everyone. Features needing *other* users' identity build on **whitelisted relation fields** (`owner`/`assignee`/`actor` trimmed to `id`/`documentId`/`username` in the controller — next entry), never on a user list. Audit recipe: users list → expect 403; `?populate[<userRelation>]=*` on core routes → expect stripped; custom controllers → whitelist via a `trimUser`-style helper.

## Returning U&P-user relations (`owner`, `assignee`, `author.username`) in responses
**Trap:** `sanitizeOutput` strips relations to the **private** `plugin::users-permissions.user` type from core `find`/`findOne` responses **entirely** — populating `owner: { fields: ['username'] }` still returns nothing. The queue UI's "claimed by X" silently renders empty. (Verified on v5.51.)
**Fix (internal/high-trust apps):** override `find`/`findOne`, fetch via the core service, and whitelist exactly the safe user fields:
```ts
const trimUser = (u: any) => (u ? { id: u.id, documentId: u.documentId, username: u.username } : null)
async find(ctx) {
  await this.validateQuery!(ctx)
  const q = await this.sanitizeQuery!(ctx)
  const { results, pagination } = await (strapi.service('api::mention.mention') as any).find(q)
  return { data: results.map((m: any) => ({ ...m, owner: trimUser(m.owner) })), meta: { pagination } }
}
```
For public-facing apps prefer a derived boolean or a `/me/...` route instead of exposing the relation at all.

## Modules: `src/api/<name>` folders by default — local plugins only when earned
**Decide this in stage 4, explicitly.** Strapi's native feature unit is an **api folder** (`src/api/<name>/` with `controllers/`, `services/`, `routes/` — **content-type optional**): route-only APIs (webhooks, custom endpoints) and service-only APIs (`strapi.service('api::analysis.ai')`) are both valid and load with zero extra wiring, compiled and watched by the app's own toolchain. Custom MCP tools register **app-level** from `src/index.ts` `register()` — no plugin required.
**Local plugins are the right call only when** a module needs its own admin-panel UI, will be reused across projects, or will be distributed. They cost a per-plugin build step (`dist/server/` output the runtime loads) that **`strapi develop` does NOT rebuild on change**, plus stringly cross-module access. A single-instance app organizing "modules" as plugins is paying for extraction it may never do — extraction from a well-bounded `src/api/` folder later is cheap. (Verified both directions on v5.51: built 5 capabilities as SDK plugins, then folded them into api folders — same behavior, less machinery.)

## Local plugin structure — when a plugin IS warranted, use the SDK layout, not a hand-rolled `strapi-server.js`
**Trap:** a single-file plain-JS `strapi-server.js` plugin boots fine and *feels* faster (no build step), so build agents shortcut to it — silently costing TypeScript, the conventional `server/src/` layout every Strapi dev recognizes, any future admin-panel part, and extractability into a publishable package. If the user supplied reference plugins or the spec names the SDK, this shortcut is a spec deviation, not an implementation detail.
**Fix:** the canonical structure (per `npx @strapi/sdk-plugin init` and the official demo repos; verified by migrating 5 plugins on v5.51):
```
src/plugins/<name>/
├── package.json          # exports "./strapi-server": { source: server/src/index.ts, require: ./dist/server/index.js }
│                         # + strapi: { kind: "plugin", name, displayName } + scripts: build/watch/verify (tsc -p server/tsconfig.build.json)
├── strapi-server.ts      # re-exports createServer from ./server/src
└── server/
    ├── tsconfig.json + tsconfig.build.json   # build outDir: ../dist/server
    └── src/
        ├── index.ts      # createServer() assembling the parts below
        ├── register.ts · bootstrap.ts · destroy.ts · config/index.ts
        └── controllers/ · routes/ · services/   (each with an index.ts barrel)
```
Enable via `config/plugins.ts`: `'<name>': { enabled: true, resolve: './src/plugins/<name>' }`. **The runtime loads `dist/server/index.js`** — wire plugin builds into the app lifecycle (`"build:plugins": "for p in src/plugins/*/; do (cd $p && npm run build) || exit 1; done"` + `prebuild`/`predevelop` hooks) or a fresh clone boots without your plugins. Plugin routes: export route sets with `type: 'content-api'` (exposed at `/api/<plugin-name>/…`) or `type: 'admin'`.
Docs: https://docs.strapi.io/cms/plugins-development/plugin-sdk · https://github.com/strapi/sdk-plugin · plugin structure https://docs.strapi.io/cms/plugins-development/plugin-structure

## `strapi generate` — human tool, NOT for build automation (verified on v5.51)
- v5 generators: `api`, `content-type`, `controller`, `service`, `policy`, `middleware`, `migration` — **the v4 `plugin` generator is gone**; scaffold plugins with `@strapi/sdk-plugin init` (also interactive).
- It is **strictly interactive** (no flags, no args): piped stdin produces nothing — the prompt library exits silently without a TTY. A build agent invoking it hangs or no-ops. **Agents write the files directly** (core factories + the structures in this cookbook); mention `strapi generate` in specs only as a human affordance. It CAN generate controllers/services *into an existing plugin* when a human drives it.

## Custom MCP tools on the official built-in server (verified on v5.51)
See `strapi-mcp-server.md` for enable/config. Two traps a build session hits:
- **`registerTool` contract:** a single object — `name` inside it (positional `registerTool('name', {...})` fails with *tool with name "undefined" must declare auth policies*). Required shape: `{ name, title, description, auth: { policies: [...] } /* or devModeOnly: true */, resolveInputSchema: () => z.object({...}), resolveOutputSchema: () => z.object({...}) /* MANDATORY */, createHandler: (strapi, ctx) => async ({ args }) => ({ content: [...], structuredContent: {...} }) }` with `z` from `@strapi/utils`. Register in a plugin's `register()` (before `mcp.start()`). Policies are CASL checks — the gate passes when the presenting token's ability satisfies **any** policy; for read tools list both conventions: `{ action: 'api::x.x.find' }` and `{ action: 'plugin::content-manager.explorer.read', subject: 'api::x.x' }`.
- **`POST /mcp` only accepts Admin Tokens (`kind: 'admin'`)** — a classic content-API token (Settings → API Tokens) authenticates fine on `/api/*` but gets JSON-RPC `-32000 "Authentication required"` on `/mcp`. Create via `POST /admin/admin-tokens` with `adminPermissions` drawn from the **admin RBAC registry** (content-api action strings are rejected as "not an existing permission action"): `{ "name": "reporting", "lifespan": null, "adminPermissions": [{ "action": "plugin::content-manager.explorer.read", "subject": "api::mention.mention" }] }`. The token's permissions also gate built-in tool visibility — a read-only token sees only `list_*`/`get_*` for its subjects (least privilege for free).

## `unique: true` is a VALIDATION rule, not a database constraint (v5.51 — highest-value trap in this file)
**Trap:** a schema field marked `"unique": true` is enforced **only by the content-API validation layer**. Strapi generates **no unique DB index**, so every write that skips that layer — **Document Service** calls, seeds, plugin ingest, cron jobs — can insert duplicates freely. The classic shape is a "safe" upsert:
```ts
const existing = await strapi.documents(uid).findFirst({ filters: { externalId } })
if (existing) return existing            // ← check
await strapi.documents(uid).create({ data })   // ← act. Two concurrent runs BOTH insert.
```
It survives testing (single writer) and breaks in production the first time a cron overlaps a manual trigger. Duplicates then **deadlock the rows**: the content API refuses to update either one (each violates uniqueness against the other), and MCP/admin clients see rows they can neither fix nor delete.
**Fix — three layers, all cheap:**
1. **A real index at bootstrap**, portable across SQLite/Postgres, plus a merge pass for pre-existing duplicates (merge = **re-parent the loser's children first**; deleting a row drops its relation link rows and orphans the trail):
   ```ts
   await strapi.db.connection.raw('CREATE UNIQUE INDEX IF NOT EXISTS mentions_external_id_uq ON mentions (external_id)')
   ```
   Guard each DDL separately and **alert ops on failure** — if the merge half-fails, the index creation then throws on every boot and the guard is silently absent.
2. **create-catch-refetch** in the writer: on violation, re-query and return the winner instead of throwing.
3. **An in-process overlap guard** on every recurring job (next entry).
> Recover by the key the index actually fires on. A `uid`/slug index + name-based recovery is a 500 waiting to happen: distinct names (`"Docs!"` vs `"Docs"`) collide to one slug, so the refetch-by-name finds nothing and the raw DB error escapes. Also give `slugify()` a fallback — non-latin names slugify to `''` and all collide.

## Recurring jobs: `config/cron-tasks.ts` does NOT serialize async runs
**Trap:** node-schedule fires on the clock, not on completion. A task doing per-item network calls (AI analysis, API sync) routinely outruns its own interval — overlapping runs re-read the same "pending" rows and duplicate the work: double AI spend, duplicate activity rows, duplicate notifications, and concurrent create races.
**Fix:** a module-level flag per job (single-instance apps), plus retry caps so failures don't starve the queue:
```ts
let running = false
export const sweep = ({ strapi }) => ({
  async run() {
    if (running) { strapi.log.info('[sweep] skipped — previous run still in progress'); return 0 }
    running = true
    try { return await this.runSweep() } finally { running = false }
  },
})
```
Pair it with an **attempt counter** on the row (`analysisAttempts`), excluded from the work query past N, alerting ops **once** when an item parks — otherwise one permanently-failing item (or a bad API key) pings ops every minute forever. Reset the counter on success **and** on any explicit re-queue action, or a later re-queue inherits a spent budget.

## Multi-write workflow operations need a transaction — and the guard belongs INSIDE it
**Trap:** "update the row, then log an activity, then notify" is 3+ independent writes. A crash between them leaves half-applied state (a status change with no audit row — usually the invariant the spec promised). Separately, a status check *before* `strapi.db.transaction()` is advisory only: two concurrent claims both read `unanswered` and both succeed.
**Fix:** Document Service calls **join an ambient transaction** (verified: `@strapi/database` propagates it via AsyncLocalStorage), so wrap the operation and re-check state under a row lock inside it:
```ts
return strapi.db.transaction(async ({ trx }) => {
  const row = await trx('mentions').where({ document_id }).forUpdate().first()   // locks on Postgres
  if (!ALLOWED_FROM.includes(row.status)) throw new WorkflowError(409, `cannot claim a '${row.status}' mention`)
  const updated = await strapi.documents(uid).update({ documentId, data })
  await logActivity(strapi, { ... })      // atomic with the update
  return updated
})
```
Keep external side effects (Slack, email) **outside** the transaction — they can't roll back. Put these methods on the **service**, not the controller: controllers become ctx adapters, and the same methods back custom routes, MCP tools, and cron jobs without re-implementing the rules. A documented state diagram that nothing enforces is decoration — make the transition table executable.

## Admin permission actions: register in `register()`, and pick the right section
**Trap (v5.51):** custom admin actions registered in the app's `bootstrap()` are **wiped off tokens and roles on every restart**. The admin plugin's own bootstrap prunes grants whose action isn't in the registry yet, and app `bootstrap()` runs *after* it — so each deploy silently revokes the checkboxes someone ticked. It reads like an auth bug, not a lifecycle bug. (Plugin-registered actions survive because plugin bootstrap runs earlier.)
**Fix:** register app-level actions in `register()`:
```ts
await strapi.service('admin::permission').actionProvider.registerMany([
  { section: 'settings', category: 'Pulse MCP tools', uid: 'pulse-mcp.queue', displayName: 'Pulse: response queue' },
])
```
**Where it renders (two independent knobs):** `section` picks the tab — `contentTypes` → Collection/Single Types, `plugins` → the Plugins tab grouped by plugin, `settings` → the Settings tab grouped by `category`. `pluginName` sets the action id (`computeActionId`): omitted → `api::<uid>`; `'octolens'` → `plugin::octolens.<uid>`; `'admin'` → `admin::<uid>`. Rule: capability shipped **inside a plugin** → `section: 'plugins'` + `pluginName`; **app-level** capability (custom routes, MCP tools) → `section: 'settings'` + a feature `category`. Gate with `{ name: 'admin::hasPermissions', config: { actions: [...] } }` on admin routes, pass the same action to `addMenuLink({ permissions })` and `widgets.register({ permissions })` so the UI hides for roles that lack it, and keep admin-facing uids **textually distinct** from same-named U&P content-api permissions.
**`displayName` is the whole documentation a teammate gets** on that screen — suffix mutating actions with `(write)`.

## Auth: `jwtManagement: 'refresh'` issues 10-MINUTE access tokens
**Trap:** enabling U&P refresh mode looks like a pure security upgrade, but `sessions.accessTokenLifespan` defaults to **600 seconds**. A frontend that stores the JWT in a 7-day cookie and has no rotation loop signs users out every ~10 minutes — and the symptom (random logouts) never points at a config default.
**Fix:** match token lifetime to the session model you actually implemented. Internal tool with no rotation loop → `jwtManagement: 'legacy-support'` + `jwt: { expiresIn: '7d' }`, matching the cookie. Adopt refresh mode **together with** the frontend work: a second httpOnly cookie for the refresh token and rotation on 401. Verify by decoding a fresh token (`exp - iat`), not by reading config.
Docs: https://docs.strapi.io/cms/features/users-permissions

## Ingest loops: isolate per item, or one bad record poisons the pipeline
**Trap:** a bare `await upsert(item)` inside a page loop lets one failure abort the whole run. With a newest-first walk and no cursor persistence, every subsequent run restarts at the same failing item — permanently blocking everything older. A guaranteed trigger: Strapi's **`string` type carries a 255-char max validator at the app layer** (not just the DB column), so one long `url`/`author` field is a deterministic poison pill. Use `text` for any externally-sourced string.
**Fix:** try/catch per item → dead-letter row + `continue`, and **dedupe the dead letter on a stable key** (a re-walked window would otherwise write the same failure hundreds of times a day). Aggregate failures into **one** ops alert per run, not one per item — a systemic outage would post thousands. Surface a `truncated` flag when a page cap stops a run before its cutoff: silent truncation reads as "everything synced."

## Small gotchas
- **SQLite local seed:** an empty `DATABASE_FILENAME=` resolves to a directory → `SQLITE_CANTOPEN`. Set `DATABASE_FILENAME=.tmp/data.db`.
- **Core-router param is `:id`, not `:documentId`.** A custom `findOne` override reading `ctx.params.documentId` on a core route gets `undefined` → every detail request 404s while `find` works (maddening to diagnose). Custom routes name their own params; read `ctx.params.documentId ?? ctx.params.id`.
- **Document Service pagination is top-level `limit`/`start`** — REST-style `pagination: { limit }` in `documents().findMany()` is a TS error in typed code and silently ignored in plugin JS (default page size applies).
- **Next.js proxy route: 204 is a null-body status.** `new NextResponse('', { status: 204 })` **throws** — even an empty string counts as a body — so every DELETE proxied to Strapi 500s while the delete itself succeeded (the UI just never updates). Pass `text || null`.
- **List vs detail populate profiles.** One populate middleware serving both `find` and `findOne` ships the full detail payload (responses + activities + comments) for **every row** of a 25-card list. Branch on `ctx.state.route.handler`: the list gets card fields plus relation **counts** (`comments: { count: true }`), the detail gets the full shape. Consumers then handle both forms (`Array.isArray(x) ? x.length : x?.count ?? 0`).
- **`uid`/slug fields are NOT auto-filled on API / Document Service / seed writes** (only admin-panel writes auto-generate them). Generate the slug in Document Service middleware for **every** content type whose `uid` you filter on — miss one and `?filters[slug]=…` silently returns nothing. (Spec tip: in stage 5, list slug middleware for *all* uid-filtered types, not just the obvious ones.)

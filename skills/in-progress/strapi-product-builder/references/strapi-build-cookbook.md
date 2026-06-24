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
Seed Public (`find`/`findOne` on public content) **and** Authenticated (`create`/`update`/`delete` on user-owned content) — an ownership app is unusable if only Public is seeded.

## Extending a plugin content type (e.g. the U&P `user`) = full replace, NOT merge
**Trap:** a `src/extensions/users-permissions/content-types/user/schema.json` containing only your *added* attributes is treated as the **complete** schema — Strapi drops the base fields (`email`, `username`, `password`, `role`), the DB ends up without those columns (`no such column: t0.email`), and auth + seeding crash (DB-corrupting). **Fix:** the extension file must reproduce the **entire** base user schema **plus** your additions. (Verified on v5.48 — copy the base schema from `node_modules/@strapi/plugin-users-permissions`.)

## Webhooks / unauthenticated third-party callbacks (e.g. Stripe)
- **Raw body for signature verification:** `strapi::body` parses the body, but signature checks (e.g. `stripe.webhooks.constructEvent`) need the **raw bytes**. In `config/middlewares.ts` use `{ name: 'strapi::body', config: { includeUnparsed: true } }`, then read the raw string from **`ctx.request.body[Symbol.for('unparsedBody')]`**. (A named `unparsed` import from `koa-body` does **not** exist — use the symbol. Not in the official middleware docs; verified empirically.)
- **Public route:** make the webhook reachable with no JWT via **`config: { auth: false }`** on the route (not a Public-role permission).
- **Carry identity:** pass the Strapi user id in Stripe's `client_reference_id`/`metadata` at checkout so the webhook knows whom to update.

## Small gotchas
- **SQLite local seed:** an empty `DATABASE_FILENAME=` resolves to a directory → `SQLITE_CANTOPEN`. Set `DATABASE_FILENAME=.tmp/data.db`.
- **`sanitizeOutput` strips private relations** (like `owner`) from responses. If the frontend needs "is this mine?", expose a derived boolean or a `/me/...` route, not the raw relation.
- **`uid`/slug fields are NOT auto-filled on API / Document Service / seed writes** (only admin-panel writes auto-generate them). Generate the slug in Document Service middleware for **every** content type whose `uid` you filter on — miss one and `?filters[slug]=…` silently returns nothing. (Spec tip: in stage 5, list slug middleware for *all* uid-filtered types, not just the obvious ones.)

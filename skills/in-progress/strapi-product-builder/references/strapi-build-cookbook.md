# Strapi v5 build cookbook — the non-obvious traps

This skill produces a *spec*; the build session generates most code itself from the spec + the official docs. This file captures only the **v5 pitfalls a build session gets wrong by default** — each with the fix and a docs link. Don't expand it into boilerplate Claude can write; look up everything else in the docs.

> Source of truth: https://docs.strapi.io (or the `strapi-docs` MCP). Re-verify at build time — Strapi's APIs move.

## Scaffold
`npx create-strapi-app@latest <dir>` — TypeScript is the default; `--quickstart` is deprecated and conflicts with `--dbclient`. Non-interactive: add `--skip-cloud --dbclient=postgres --dbhost=… --dbport=… --dbname=… --dbusername=… --dbpassword=…` (SQLite for local-only).

## Set a server-only field on create (e.g. `owner` = current user)
**Trap:** mutating `ctx.request.body.data.owner` then `super.create(ctx)` → **400 "Invalid key owner"** (v5 re-validates the body against user-writable fields and rejects private relations).
**Fix:** create via the **Document Service** (bypasses input validation), then sanitize:
```ts
// src/api/product/controllers/product.ts
import { factories } from '@strapi/strapi'
export default factories.createCoreController('api::product.product', ({ strapi }) => ({
  async create(ctx) {
    const data = await this.sanitizeInput(ctx.request.body.data, ctx)
    const entry = await strapi.documents('api::product.product').create({
      data: { ...data, owner: ctx.state.user.id },
    })
    return this.transformResponse(await this.sanitizeOutput(entry, ctx))
  },
}))
```
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

## Seed end-user accounts that can actually log in
**Trap:** `strapi.query('plugin::users-permissions.user').create({ data: { password } })` stores the password **unhashed** → login fails (hashing lives in the U&P flow, not `query`/`entityService`).
**Fix:** create users through the U&P user service (or the `/api/auth/local/register` flow) so the password hashes. Docs: https://docs.strapi.io/cms/features/users-permissions

## Seed BOTH roles
Seed Public (`find`/`findOne` on public content) **and** Authenticated (`create`/`update`/`delete` on user-owned content) — an ownership app is unusable if only Public is seeded.

## Small gotchas
- **SQLite local seed:** an empty `DATABASE_FILENAME=` resolves to a directory → `SQLITE_CANTOPEN`. Set `DATABASE_FILENAME=.tmp/data.db`.
- **`sanitizeOutput` strips private relations** (like `owner`) from responses. If the frontend needs "is this mine?", expose a derived boolean or a `/me/...` route, not the raw relation.

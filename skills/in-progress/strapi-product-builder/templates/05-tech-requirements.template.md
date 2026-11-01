# Technical Requirements

> Verified against Strapi v5 docs (https://docs.strapi.io) on [date].
> When in doubt during build, query the strapi-docs MCP first.

## Strapi content types

### `api::<name>.<name>` — [collection-type | single-type]
| Field | Type | Notes |
|-------|------|-------|
| title | string | required, max 120 |
| slug | uid (target: title) | unique |
| body | blocks | modern rich-text editor (its own type; use legacy `richtext` only if you want Markdown) |
| cover | media (single, images) | |
| author | relation: manyToOne -> api::author.author | |

- Draft & publish: yes/no — set `draftAndPublish` explicitly in the schema (omitted = off). If yes on user-generated content: how a user's post gets published
- Localized: yes/no (fields: ...)
- Server-set / derived fields: ... (which layer handles each — see Lifecycles / policies / middlewares below)

(Repeat per content type.)

## Components

### `shared.seo`
| Field | Type | Notes |
|-------|------|-------|
| metaTitle | string | required |
| metaDescription | text | |
| ogImage | media | |

(Repeat per component, grouped by category.)

## Dynamic zones

### `page.blocks`
- Used by: `api::page.page` (field `blocks`)
- Accepts: `blocks.hero`, `blocks.feature-grid`, `blocks.cta`, `blocks.faq`

## API surface

### REST (auto-generated)
- `GET /api/articles` — public, default-populated via route middleware
- `GET /api/articles/:documentId` — public
- `POST /api/articles` — auth required (Authenticated role)

### Default population strategy
- Configured via API-scoped middlewares in `src/api/<api>/middlewares/` (UID `api::<api>.<name>`) and applied in route files. (`src/middlewares/` is for `global::` middlewares only.) See `references/content-modeling.md`.

### Custom routes
- `POST /api/checkout` — auth required, calls Stripe, returns `{ url }`

### GraphQL (if applicable)
- Query `articles(filters, pagination)` — fields: ...

## MCP server (if enabled in stage 4)
> Only if the product exposes Strapi's built-in MCP server (GA since v5.49). Delete this section otherwise. See `references/strapi-mcp-server.md`.
- Enabled via `mcp: { enabled: true }` in `config/server`; endpoint `POST /mcp`
- Auth: scoped **Admin API token** (`Authorization: Bearer <token>`), least-privilege per use case
- Exposed content types / actions: [e.g. `api::article.article` → list/get/create/update/publish]
- Custom tools (optional): [plugin + `strapi.ai.mcp` registrations, e.g. `approve-order`]
- Known limitations: no new media uploads, dynamic zones untyped, stateless `POST`-only

## Auth
> Choose one based on stage 4. Use the matching block; delete the other.

### Option A — stock Users & Permissions (default)
- email/password (+ optional providers via U&P), JWT-based
- Plugin settings seeded in `bootstrap()`: the reset-password and email-confirmation URLs (always, if those flows exist); each social provider's settings (if any)
- Social providers (if any): [which]; the frontend has a redirect route that finishes the flow. It calls `/api/auth/<provider>/callback` with Strapi's session cookie, so it needs a shared parent domain (a proxy works in principle but changes Strapi's `url` and every callback URL — unverified)
- Roles below apply (Public / Authenticated / custom)

### Option B — Better Auth (`@strapi-community/plugin-better-auth`) ⚠️ beta, opt-in
- Relations to the Better Auth `user`: the type is created with the others, and only that attribute is added after the generate step, as a one-way relation (no `inversedBy`); relation `target` = [the generated user UID — read it after generate]
- Plugin: https://github.com/strapi-community/plugin-better-auth · requires Strapi ≥ 5.45 · **removes Users & Permissions**
- Config in `src/lib/auth.ts` (`betterAuth({ database: strapiAdapter(), advanced: { database: { generateId: 'serial' } } })`); enable in `config/plugins.ts`
- Providers enabled: email/password, [Google, ...]
- Session: cookie-based, mounted under `/api/auth` (details in **Session** below)
- Frontend: read the session via the Better Auth client (`better-auth/react` or `better-auth/vue`), `baseURL` = the origin the browser sends auth calls to + `/api/auth` (Strapi's origin, or the frontend's own under the proxy topology)
- Generated `user` / `session` / `account` / `verification` types: no content-API role gets any action on them; a relation to `user` (e.g. `author`) is populated with whitelisted fields only
- Protected routes: ...

## Session
> Applies to whichever auth option you kept. Follows the session topology chosen in stage 4; on the Better Auth path, copy the matching row of the per-topology table in `references/auth-better-auth.md`.
- Lives in: [U&P JWT in an `httpOnly` cookie on the frontend's domain | Better Auth cookie on <shared parent domain> | ...]
- Cookie flags: `httpOnly`, `secure`, `sameSite=[lax | strict | none]` — [why it fits the topology]
- Lifetime: [e.g. 7 days] — matches the backend token lifetime
- On expiry: [redirect to sign-in | refresh]
- Better Auth path: cookie domain, `BETTER_AUTH_URL`, client `baseURL`, provider redirect URI, `trustedOrigins`, CORS — [from the table]

## Permissions & roles
> **Better Auth path**: U&P is removed — content-API permissions are governed by `@strapi-community/plugin-api-permissions`. Describe per-content-type read/write there.
> **Stock U&P path**: use the roles below. Either way, the grants are seeded in `bootstrap()`, idempotently.

### End-user roles (content API)
- **Public**: read [content types]
- **Authenticated**: read+write [content types]
- **Custom end-user role `[name]`**: ...
- `plugin::upload`: no Public action (media fields populate without it; `find` lists every file); Authenticated gets `upload` only if users upload, never `find` or `destroy`

### Admin roles (Strapi admin panel, `/admin`)
- **Editor**: edits [content types]
- **Custom admin role `[name]`** (e.g. a moderator who hides user content): ...
- How bad content is hidden: [unpublish (draft & publish on) | a `hidden` boolean the controller filters out | delete]
- How these roles exist on a fresh database: [user step after the first admin signs in | seeded]

## Server-side handlers
> Every frontend server-side handler that calls Strapi (route handler, server action, loader, server route). A handler that reads private data or writes for a user checks the session before calling Strapi; a public read that sends a token uses a custom token limited to the read actions it needs, never read-only or full-access; a user ID or owner comes from the session, never from the request body.

| Handler | Calls Strapi with | Checks first |
|---|---|---|
| [e.g. `app/articles/[slug]/page.tsx`] | custom read token | nothing — public read |
| [e.g. `app/api/comments/route.ts` POST] | the user's JWT, from the session cookie | session present, else 401 |

## Lifecycles / policies / middlewares
> Pick the layer by context (see `references/strapi-build-cookbook.md`): request/auth-aware logic → **controller**; document-level logic without the request → **Document Service middleware** (`strapi.documents.use()` in `register()`). Avoid lifecycle hooks for business logic in v5 — no request context, and they fire twice on publish.
- Document Service middleware: generate `slug` for `api::article.article` if missing (uid fields are NOT auto-filled on API/seed writes)
- Controller `api::article.article` `create`: stamp `author` from `ctx.state.user` via the Document Service
- Policy `is-owner` applied to `PUT /api/articles/:documentId`
- Middleware `api::article.populate-article` applied to `GET /api/articles*`

## Pages & components (frontend)
> Use the chosen framework's route convention — `app/` (Next.js), `src/routes/` (TanStack Start), `src/pages/` (Astro), `pages/` (Nuxt). "Fetch" below = loader / Server Component / `useFetch` / Astro frontmatter as appropriate.

### Route: `/` (home)
- Access: public
- Fetch: `GET /api/page?filters[slug]=home&populate=...` — custom read token, on the server
- Rendering: [built ahead, refreshed by <rebuild | time-based refresh | Strapi webhook> | per request | in the browser]
- Components: Hero, FeatureGrid, CTA

### Route: `/articles/[slug]`
- Access: public
- Fetch: `GET /api/articles?filters[slug]=<slug>` — custom read token, on the server
- Rendering: ...
- States (core-loop routes): loading · empty · error · not found
- Components: ArticleHeader, ArticleBody, RelatedArticles

(Repeat per route. Every route gets Access, Fetch with its credential, and Rendering; core-loop routes also get States.)

## State management
- Server state: framework data layer (loaders / Server Components / `useFetch`) + TanStack Query for client refetches
- URL state: filters, search, pagination
- Client state: minimal

## Background jobs
- `config/cron-tasks.ts` `0 * * * *` — refresh sitemap (set `cron.enabled: true` in `config/server`)
- On a Strapi Cloud plan that sleeps when idle, cron tasks can't run while it sleeps — say whether that's acceptable

## Media & uploads
- Provider: Strapi Cloud media (default)
- Image formats: original + thumbnail, small, medium, large
- Allowed types: ...

## Outside services and other apps
> Every external service, and every other app in the product (a worker, a second frontend, a script that writes data). Keys a browser can see must be ones the provider marks browser-safe.

| Service or app | Used for | Required? | If it fails | Test mode |
|---|---|---|---|---|
| [e.g. Stripe] | checkout | required for paid plans | checkout shows an error; nothing is charged | test keys |
| [e.g. OpenAI] | summaries | optional | feature hidden, 503; core loop unaffected | local mock via `OPENAI_BASE_URL` |
| [e.g. email provider] | reset and confirmation emails | required if those flows exist | [what users see] | local SMTP catcher (e.g. Mailpit) |
| [e.g. `apps/worker`] | nightly import | required | ops alert; retried next run (retry cap) | runs against local Strapi |

## Hosting & environments
- Hosts: Strapi → Strapi Cloud · frontend → [host] · [other apps → host]
- Environments: local → local Strapi · preview → [which Strapi] · production → production Strapi
- Preview sign-in: [how previews sign in — e.g. with a shared parent domain, previews on `*.vercel.app` can't use the auth cookie: a preview custom domain, or no sign-in on previews]
- Webhooks (if a route refreshes by webhook): [Strapi webhook URL, the header carrying the secret, events] — created per environment in Settings → Webhooks
- CORS (`strapi::cors` in `config/middlewares.ts`): `origin` = [the exact frontend origins whose browsers call Strapi directly | `[]` — every call goes through the frontend's server]. Never leave it bare (the default is `origin: '*'` with `credentials: true`), never `*` with credentials, and limit preview patterns to domains the team controls
- CI: [what runs on each push — lint, type check, tests] | N/A — [reason]

## Operations (robustness sweep)
> One line per robustness-sweep item: where this file specifies it, or `N/A — <reason>` when the user declined it.
- Silent failure modes: ...
- Uniqueness under concurrency: ...
- Recurring-job reentrancy: ...
- (one line per remaining sweep item)

## Environment variables

### Strapi backend
- `DATABASE_*` — local Postgres only. **Set none on Strapi Cloud**: Cloud provides its own PostgreSQL, and any `DATABASE_*` variable switches the project to an external database
- `APP_KEYS`, `JWT_SECRET`, `ADMIN_JWT_SECRET`, `API_TOKEN_SALT`, `TRANSFER_TOKEN_SALT`, `ENCRYPTION_KEY` — the docs say these are generated; check `.env` has them (`JWT_SECRET` was seen missing once — the cookbook's Scaffold entry). On Strapi Cloud, check the project's Variables tab for the defaults before adding your own (`ENCRYPTION_KEY` lets admins view API tokens again after creation)
- `BETTER_AUTH_SECRET` — `openssl rand -hex 32` (Better Auth path only)
- `BETTER_AUTH_URL` — the public auth origin for the session topology: custom API domain, or the frontend's origin under the proxy (Better Auth path only)
- `CLIENT_URL` — frontend URL, used for `trustedOrigins` (Better Auth path only)
- `AUTH_COOKIE_DOMAIN` — shared parent domain only: empty locally, the parent domain in production; turns on `crossSubDomainCookies` (Better Auth path only)
- `PUBLIC_URL` — Strapi's public URL, read as `url` in `config/server.ts`; U&P builds the confirmation link and provider redirect URLs from it (stock U&P, if email confirmation or social login is on)
- Stock U&P path: the reset-password and confirmation URLs, and each provider's client ID, secret and frontend redirect URL, seeded into the plugin store
- `BETTER_AUTH_DASHBOARD_SECRET` — only if the dashboard plugin is installed; set a real value (the plugin README's example falls back to a hard-coded key)
- (provider-specific vars)

### Frontend
> `<PUBLIC>` below is a placeholder for the stage-4 framework's public prefix — `NEXT_PUBLIC_` (Next.js) / `VITE_` (TanStack Start, Vite) / `PUBLIC_` (Astro) / `NUXT_PUBLIC_` (Nuxt). **Substitute the real prefix when writing the output file** — never leave `<PUBLIC>` (or a wrong-framework prefix) in the generated spec.
- `<PUBLIC>STRAPI_URL` — public Strapi backend URL (browser-safe)
- `STRAPI_API_TOKEN` — custom token for **server-side** SSR fetches, holding only the `find`/`findOne` actions the routes call (not the read-only type, which reads every `find` route, `GET /api/users` included). **No public prefix** — must stay server-only or it leaks into the client bundle
- `<PUBLIC>AUTH_BASE_URL` — Better Auth **client** `baseURL` = the origin the browser sends auth calls to **+ `/api/auth`** (browser-safe; Better Auth path only). Note it differs from the backend's `BETTER_AUTH_URL`, which is a bare origin
- `AUTH_PROXY_TARGET` — proxy topology only: the Strapi origin the frontend forwards `/api/auth/*` to (server-only)

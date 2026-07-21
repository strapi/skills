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

- Draft & publish: yes/no
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
- Roles below apply (Public / Authenticated / custom)

### Option B — Better Auth (`@strapi-community/plugin-better-auth`) ⚠️ beta, opt-in
- Plugin: https://github.com/strapi-community/plugin-better-auth · requires Strapi ≥ 5.45 · **removes Users & Permissions**
- Config in `src/lib/auth.ts` (`betterAuth({ database: strapiAdapter(), advanced: { database: { generateId: 'serial' } } })`); enable in `config/plugins.ts`
- Providers enabled: email/password, [Google, ...]
- Session: cookie-based, mounted under `/api/auth`
- Frontend: read the session via the Better Auth client (`better-auth/react` or `better-auth/vue`), `baseURL` = Strapi origin + `/api/auth`
- Protected routes: ...

## Permissions & roles
> **Better Auth path**: U&P is removed — content-API permissions are governed by `@strapi-community/plugin-api-permissions`. Describe per-content-type read/write there.
> **Stock U&P path**: use the roles below.
- **Public**: read [content types]
- **Authenticated**: read+write [content types]
- **Custom role `editor`**: ...

## Lifecycles / policies / middlewares
> Pick the layer by context (see `references/strapi-build-cookbook.md`): request/auth-aware logic → **controller**; document-level logic without the request → **Document Service middleware** (`strapi.documents.use()` in `register()`). Avoid lifecycle hooks for business logic in v5 — no request context, and they fire twice on publish.
- Document Service middleware: generate `slug` for `api::article.article` if missing (uid fields are NOT auto-filled on API/seed writes)
- Controller `api::article.article` `create`: stamp `author` from `ctx.state.user` via the Document Service
- Policy `is-owner` applied to `PUT /api/articles/:documentId`
- Middleware `api::article.populate-article` applied to `GET /api/articles*`

## Pages & components (frontend)
> Use the chosen framework's route convention — `app/` (Next.js), `src/routes/` (TanStack Start), `src/pages/` (Astro), `pages/` (Nuxt). "Fetch" below = loader / Server Component / `useFetch` / Astro frontmatter as appropriate.

### Route: `/` (home)
- Fetch: `GET /api/page?filters[slug]=home&populate=...`
- Components: Hero, FeatureGrid, CTA

### Route: `/articles/[slug]`
- Fetch: `GET /api/articles?filters[slug]=<slug>`
- Components: ArticleHeader, ArticleBody, RelatedArticles

(Repeat per route.)

## State management
- Server state: framework data layer (loaders / Server Components / `useFetch`) + TanStack Query for client refetches
- URL state: filters, search, pagination
- Client state: minimal

## Background jobs
- `config/cron-tasks.ts` `0 * * * *` — refresh sitemap (set `cron.enabled: true` in `config/server`)

## Media & uploads
- Provider: Strapi Cloud media (default)
- Image formats: original + thumbnail, small, medium, large
- Allowed types: ...

## Environment variables

### Strapi backend
- `DATABASE_URL` — Postgres connection (Strapi Cloud injects)
- `APP_KEYS`, `JWT_SECRET`, `ADMIN_JWT_SECRET`, `API_TOKEN_SALT`, `TRANSFER_TOKEN_SALT` — Strapi Cloud injects
- `BETTER_AUTH_SECRET` — `openssl rand -hex 32` (Better Auth path only)
- `BETTER_AUTH_URL` — public Strapi URL (Better Auth path only)
- (provider-specific vars)

### Frontend
> `<PUBLIC>` below is a placeholder for the stage-4 framework's public prefix — `NEXT_PUBLIC_` (Next.js) / `VITE_` (TanStack Start, Vite) / `PUBLIC_` (Astro) / `NUXT_PUBLIC_` (Nuxt). **Substitute the real prefix when writing the output file** — never leave `<PUBLIC>` (or a wrong-framework prefix) in the generated spec.
- `<PUBLIC>STRAPI_URL` — public Strapi backend URL (browser-safe)
- `STRAPI_API_TOKEN` — read-only token for **server-side** SSR fetches. **No public prefix** — must stay server-only or it leaks into the client bundle
- `<PUBLIC>AUTH_BASE_URL` — Better Auth **client** `baseURL` = Strapi origin **+ `/api/auth`** (browser-safe; Better Auth path only). Note it differs from the backend's `BETTER_AUTH_URL`, which is the bare origin

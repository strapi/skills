# Technical Requirements

> Verified against Strapi v5 docs (https://docs.strapi.io) on [date].
> When in doubt during build, query the strapi-docs MCP first.

## Strapi content types

### `api::<name>.<name>` — [collection-type | single-type]
| Field | Type | Notes |
|-------|------|-------|
| title | string | required, max 120 |
| slug | uid (target: title) | unique |
| body | richtext (blocks) | |
| cover | media (single, images) | |
| author | relation: manyToOne -> api::author.author | |

- Draft & publish: yes/no
- Localized: yes/no (fields: ...)
- Lifecycle hooks: ...

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
- Configured via middlewares in `src/middlewares/` and applied in route files. See `references/content-modeling.md`.

### Custom routes
- `POST /api/checkout` — auth required, calls Stripe, returns `{ url }`

### GraphQL (if applicable)
- Query `articles(filters, pagination)` — fields: ...

## Auth
> Choose one based on stage 4. Use the matching block; delete the other.

### Option A — Better Auth (`@strapi-community/plugin-better-auth`) ⚠️ beta
- Plugin: https://github.com/strapi-community/plugin-better-auth · requires Strapi ≥ 5.45 · **removes Users & Permissions**
- Config in `src/lib/auth.ts` (`betterAuth({ database: strapiAdapter(), advanced: { database: { generateId: 'serial' } } })`); enable in `config/plugins.ts`
- Providers enabled: email/password, [Google, ...]
- Session: cookie-based, mounted under `/api/auth`
- Frontend: read the session via the Better Auth client (`better-auth/react` or `better-auth/vue`)
- Protected routes: ...

### Option B — stock Users & Permissions
- email/password (+ optional providers via U&P), JWT-based
- Roles below apply (Public / Authenticated / custom)

## Permissions & roles
> **Better Auth path**: U&P is removed — content-API permissions are governed by `@strapi-community/plugin-api-permissions`. Describe per-content-type read/write there.
> **Stock U&P path**: use the roles below.
- **Public**: read [content types]
- **Authenticated**: read+write [content types]
- **Custom role `editor`**: ...

## Lifecycles / policies / middlewares
- `api::article.article` `beforeCreate`: generate slug if missing
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
> Prefix browser-safe values with the framework's public prefix (`NEXT_PUBLIC_` / `VITE_` / `PUBLIC_` / `NUXT_PUBLIC_`). Below shown with `VITE_` as an example.
- `VITE_STRAPI_URL` — public Strapi backend URL (browser-safe)
- `STRAPI_API_TOKEN` — read-only token for **server-side** SSR fetches. **No public prefix** — must stay server-only or it leaks into the client bundle
- `BETTER_AUTH_URL` — same as backend (Better Auth path only)

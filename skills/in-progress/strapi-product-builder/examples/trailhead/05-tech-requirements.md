# Technical Requirements

> Verified against Strapi v5 docs (https://docs.strapi.io) on 2026-06-02.
> When in doubt during build, query the strapi-docs MCP first.
> Auth = Better Auth path (beta) → Users & Permissions is removed; content-API permissions are governed by `@strapi-community/plugin-api-permissions`. Frontend = Next.js App Router (`app/`, `NEXT_PUBLIC_` prefix).

## Strapi content types

### `api::trail.trail` — collection-type
| Field | Type | Notes |
|-------|------|-------|
| name | string | required, max 120 |
| slug | uid (target: name) | unique |
| region | relation: manyToOne -> api::region.region | |
| difficulty | enumeration | easy / moderate / hard |
| lengthKm | decimal | |
| description | blocks | modern rich-text (not legacy `richtext`) |
| location | component `shared.location` | single |
| hero | media (single, images) | |
| featured | boolean | default false |
| seo | component `shared.seo` | single |

- Draft & publish: **yes** (moderators stage trails)
- Localized: no
- Slug: generate `slug` from `name` via **Document Service middleware** (`strapi.documents.use()` in `register()`) — not lifecycle hooks (v5)

### `api::region.region` — collection-type
| Field | Type | Notes |
|-------|------|-------|
| name | string | required |
| slug | uid (target: name) | unique |

- Draft & publish: no · Localized: no

### `api::report.report` — collection-type (user-generated)
| Field | Type | Notes |
|-------|------|-------|
| trail | relation: manyToOne -> api::trail.trail | required |
| rating | enumeration | clear / muddy / flooded / icy / closed |
| note | text | max 500 |
| photo | media (single, images) | optional |
| dateHiked | date | required |
| author | relation: manyToOne -> (Better Auth user) | set server-side from session, not client |

- Draft & publish: **no** (reports are live)
- Localized: no
- Author: stamped server-side in the `create` **controller** from the authenticated session (Document Service create) — not a `beforeCreate` hook (lifecycles have no session context); 403 if no session

## Components

### `shared.location`
| Field | Type | Notes |
|-------|------|-------|
| lat | decimal | |
| lng | decimal | |
| trailheadNote | text | parking / access |

### `shared.seo`
| Field | Type | Notes |
|-------|------|-------|
| metaTitle | string | required |
| metaDescription | text | |
| ogImage | media | |

## Dynamic zones
- None in MVP. (v2: a `trail.blocks` dynamic zone accepting `blocks.gallery`, `blocks.tips`, `blocks.nearby`.)

## API surface

### REST (auto-generated)
- `GET /api/trails` — public, default-populated (region, hero, location) via route middleware
- `GET /api/trails/:documentId` — public
- `GET /api/reports?filters[trail][slug][$eq]=<slug>&sort=createdAt:desc` — public read
- `POST /api/reports` — **authenticated session required**; author stamped server-side
- `PUT/DELETE /api/reports/:documentId` — authenticated **and** owner only (policy)

### Default population strategy
- Route middleware on `GET /api/trails*` sets `populate` for `region`, `hero`, `location`, `seo`. Reports list populates `author` (name only) + `photo`. Configured in `src/middlewares/` and applied in route files — see `references/content-modeling.md`.

### Custom routes
- None required for MVP — auto endpoints + an `is-owner` policy cover it.

### GraphQL
- Not installed (REST is sufficient).

## Auth (Better Auth — beta path; follows the official Strapi tutorial)
- Packages: `better-auth` + `@strapi-community/plugin-better-auth` (beta) + `@strapi-community/plugin-api-permissions` (alpha) + `@strapi-community/plugin-better-auth-dashboard` + `@better-auth/infra` + `zod@^4.1.12`. Requires Strapi ≥ 5.45.
- **Uninstall `@strapi/plugin-users-permissions`** from package.json (Strapi won't boot with both).
- Enable `better-auth`, `better-auth-dashboard`, `api-permissions` in `config/plugins.ts`.
- Config in **`src/lib/auth.ts`** — export the betterAuth **instance** (runtime auto-discovers this file):
  `export const auth = betterAuth({ database: strapiAdapter(), trustedOrigins: [process.env.CLIENT_URL ?? 'http://localhost:3000'], emailAndPassword: { enabled: true }, socialProviders: { google: {...} }, advanced: { database: { generateId: 'serial' } } })`
- Run `npx @better-auth/cli generate --config src/lib/auth.ts --yes` to create the user/session/account/verification content types.
- Providers enabled: email/password, Google
- Session: cookie-based, mounted under `/api/auth`
- Frontend: Next.js client `better-auth/react`; Server Components read the session via the server helper (forward cookies on server fetch)
- Protected routes: the "post a report" dialog and `/my-reports`

## Permissions & roles
> Better Auth path — **not** the stock U&P role model. Governed by `plugin-api-permissions`:
- **Anonymous (no session)**: read `trail`, `region`, `report`; read uploaded media.
- **Authenticated session**: create `report`; update/delete only own `report` (enforced by `is-owner` policy).
- **Moderator**: edits Trails/Regions in the Strapi **admin** panel (admin role, separate from end-user auth).

## Lifecycles / policies / middlewares
- Slug generation (`trail`, `region`): **Document Service middleware** (`strapi.documents.use()` in `register()`) — not lifecycle hooks (no request context; they double-fire on publish in v5). See *What are Document Service Middleware…* and *When To Use Lifecycle Hooks* in `references/resources.md`.
- `author` on `report`: stamped in the **`create` controller** from the authenticated session (Document Service create) — not a `beforeCreate` hook (no session). 403 if unauthenticated.
- Policy `global::is-owner` on `PUT/DELETE /api/reports/:documentId`.
- Middleware `api::trail.populate-trail` on `GET /api/trails*`.

## Pages & components (Next.js App Router — `app/`)

### Route: `/` (home)
- Fetch (Server Component): `GET /api/trails?filters[featured][$eq]=true` + a few freshest-report trails
- Components: FeaturedTrails, RecentlyReported

### Route: `/trails` (browse/search)
- Fetch: `GET /api/trails?filters[name][$containsi]=<q>&pagination[pageSize]=20`
- Components: SearchBar, TrailCard grid, RegionFilter (URL state)

### Route: `/trails/[slug]`
- Fetch: trail by slug + `GET /api/reports?filters[trail][slug][$eq]=<slug>&sort=createdAt:desc`
- Components: TrailHeader, FreshnessBadge, ReportList, PostReportButton (auth-gated)

### Route: `/my-reports` (protected)
- Fetch: reports where author = session user
- Components: MyReportList (edit/delete)

### Routes: `/sign-in`, `/sign-up`
- Better Auth client forms (shadcn/ui)

## State management
- Server state: Next.js Server Components / `fetch` with revalidation for public reads; TanStack Query for the client-side report dialog + `/my-reports` refetch.
- URL state: search query, region filter, pagination.
- Client state: minimal (dialog open/close, form state).

## Background jobs
- None for MVP. (v2: `config/cron-tasks.ts` nightly to recompute "freshness" buckets, with `cron.enabled: true` in `config/server`.)

## Media & uploads
- Provider: Strapi Cloud media (default). Report photos + trail heroes.
- Image formats: original + thumbnail/small/medium/large (Strapi defaults).
- Allowed types: images only.

## Environment variables

### Strapi backend
- `DATABASE_URL` (or `DATABASE_CLIENT`/`DATABASE_HOST`/...) — Postgres (Strapi Cloud injects)
- `APP_KEYS`, `JWT_SECRET`, `ADMIN_JWT_SECRET`, `API_TOKEN_SALT`, `TRANSFER_TOKEN_SALT` — Strapi Cloud injects
- `BETTER_AUTH_SECRET` — `openssl rand -hex 32`
- `BETTER_AUTH_URL` — public Strapi URL (e.g., `https://trailhead.strapiapp.com`)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `RESEND_API_KEY`

### Next.js frontend
- `NEXT_PUBLIC_STRAPI_URL` — public Strapi backend URL (browser-safe)
- `STRAPI_API_TOKEN` — server-only read token for SSR fetches; **no `NEXT_PUBLIC_` prefix** (would leak to the client bundle)
- `BETTER_AUTH_URL` — same as backend (used by the Better Auth client baseURL)

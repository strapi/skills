# Trailhead — Claude Code Build Spec

> **Build target**: Strapi v5 (deployed to Strapi Cloud) + Next.js (App Router) frontend.
> **Docs lookup**: query the `strapi-docs` MCP first; otherwise WebFetch https://docs.strapi.io.
> **Self-contained**: build straight from this spec + the official Strapi docs (https://docs.strapi.io or the `strapi-docs` MCP). Better Auth follows the official tutorial: https://strapi.io/blog/strapi-better-auth-tutorial-setup-guide-for-strapi-v5-and-next-js-16

## Project overview
Trailhead is a community app where local hikers post and read up-to-the-day trail condition reports, so nobody drives an hour to a washed-out trail. Public reads, authenticated posting, and a moderator-curated trail list. One-liner: *day-fresh trail conditions, by the people who were just there.*

## Stack
- Backend / CMS: Strapi v5 (Node ≥ 20)
- Database: PostgreSQL (managed by Strapi Cloud)
- Backend hosting: Strapi Cloud
- Frontend: Next.js (App Router, React Server Components)
- Auth: Better Auth via `@strapi-community/plugin-better-auth` + `@strapi-community/plugin-api-permissions` (⚠️ beta; Strapi ≥ 5.45; U&P removed)
- Frontend hosting: Vercel
- Styling: Tailwind + shadcn/ui
- Email: Resend (transactional) · Analytics: Plausible

## Repo layout
```
trailhead/
├── apps/
│   ├── cms/          # Strapi v5
│   └── web/          # Next.js (App Router)
├── package.json      # workspaces
└── README.md
```

## Setup commands
```bash
# 1. Strapi backend  (TypeScript is default; --quickstart is deprecated & conflicts with --dbclient)
npx create-strapi-app@latest apps/cms \
  --non-interactive --skip-cloud \
  --dbclient=postgres --dbhost=127.0.0.1 --dbport=5432 \
  --dbname=trailhead --dbusername=postgres --dbpassword=postgres
cd apps/cms && npm install better-auth @strapi-community/plugin-better-auth @strapi-community/plugin-api-permissions

# 2. Next.js frontend
npx create-next-app@latest apps/web
cd apps/web && npm install better-auth @tanstack/react-query
```

## Build order

### M1 — Strapi scaffold + Strapi Cloud project linked
**Tasks**:
- [ ] Create the content types from the schemas below
- [ ] Create Strapi Cloud project, link repo (root `apps/cms`), set env vars
**Done when**: `npm run develop` boots locally on Postgres and `git push` deploys to Strapi Cloud.

### M2 — Content model
**Tasks**: Trail, Region, Report collection types; `shared.location` + `shared.seo` components; draft&publish on Trail; populate middleware on `GET /api/trails*`.
**Done when**: admin shows all three types + components; a moderator can create and publish a Trail.

### M3 — Auth (Better Auth path — beta, confirmed)
**Tasks**:
- [ ] Install + configure Better Auth (steps below follow the official tutorial):
- [ ] `npm install better-auth @strapi-community/plugin-better-auth @strapi-community/plugin-api-permissions @strapi-community/plugin-better-auth-dashboard @better-auth/infra zod@^4.1.12`
- [ ] `npm uninstall @strapi/plugin-users-permissions` (mandatory — remove from package.json; Strapi won't boot with both)
- [ ] Enable `better-auth`, `better-auth-dashboard`, `api-permissions` in `config/plugins.ts`
- [ ] Create `src/lib/auth.ts` exporting the betterAuth **instance** with `strapiAdapter()` + **`advanced.database.generateId: 'serial'`** (runtime auto-discovers this file; not a factory)
- [ ] `npx @better-auth/cli generate --config src/lib/auth.ts --yes` (creates user/session/account/verification content types)
- [ ] email/password + Google; set `BETTER_AUTH_SECRET`, `STRAPI_URL`, `CLIENT_URL` (→ trustedOrigins), Google creds
- [ ] Configure `plugin-api-permissions` (alpha): anonymous read on trail/region/report + media; authenticated create on report
- [ ] Requires Strapi ≥ 5.45; boot + verify `/api/auth/*` mounts (expect to debug — beta/alpha stack)
**Done when**: a user can sign up (email + Google), sign in, and sign out from the Next.js app.

### M4 — Lifecycles / policies / middlewares
- [ ] Trail slug generation via Document Service middleware (`strapi.documents.use()` in `register()`) — v5-preferred over lifecycle hooks
- [ ] Report controller `create` stamps `author` from `ctx.state.user` via the Document Service (lifecycle hooks have no request context); 403 if unauthenticated
- [ ] `global::is-owner` policy on `PUT/DELETE /api/reports/:documentId`
- [ ] `populate-trail` middleware

### M5 — Next.js routes + data fetching (`app/`)
- [ ] `/`, `/trails`, `/trails/[slug]`, `/my-reports` (protected), `/sign-in`, `/sign-up` — Server Components fetch Strapi; TanStack Query for the post-report dialog

### M6 — Auth UI
- [ ] `better-auth/react` client; auth-gated PostReportButton; protected `/my-reports`

### M7 — Seed data + media
- [ ] Seed ~3 regions, ~12 trails (with hero images), a handful of reports (seed script via the Document Service)

### M8 — Deploy
- [ ] Backend → Strapi Cloud (push); Frontend → Vercel (set env vars)
- [ ] **Cross-site cookies**: Vercel + Strapi Cloud are different domains → set `trustedOrigins` + production `defaultCookieAttributes` (SameSite=None; Secure)
- [ ] Smoke test the core loop end-to-end
**Done when**: acceptance criteria below pass on deployed URLs.

## Strapi schemas
See stage 5 — `api::trail.trail`, `api::region.region`, `api::report.report`; components `shared.location`, `shared.seo`. `description` uses the modern `blocks` field type (not legacy `richtext`).

## API surface
Auto REST: `GET /api/trails`, `GET /api/trails/:documentId`, `GET /api/reports` (filtered by trail slug, sorted desc) — public; `POST /api/reports` — authenticated; `PUT/DELETE /api/reports/:documentId` — owner only. Default population via `populate-trail` middleware. No GraphQL.

## Auth
- Better Auth (beta) + api-permissions; config in `src/lib/auth.ts` (`generateId: 'serial'`); Strapi ≥ 5.45.
- Providers: email/password, Google. Client: `better-auth/react`. Protected: post-report dialog, `/my-reports`.

## Frontend route/page tree (Next.js App Router)
```
apps/web/app/
├── layout.tsx
├── page.tsx                 # home: featured + recently reported
├── trails/
│   ├── page.tsx             # browse/search
│   └── [slug]/page.tsx      # trail + reports + post button
├── my-reports/page.tsx      # protected
├── sign-in/page.tsx
└── sign-up/page.tsx
```

## Environment variables

### Strapi (apps/cms)
- `DATABASE_URL` (Strapi Cloud injects), `APP_KEYS`, `JWT_SECRET`, `ADMIN_JWT_SECRET`, `API_TOKEN_SALT`, `TRANSFER_TOKEN_SALT`
- `BETTER_AUTH_SECRET` (`openssl rand -hex 32`), `BETTER_AUTH_URL` (public Strapi URL)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`

### Next.js (apps/web)
- `NEXT_PUBLIC_STRAPI_URL` — public Strapi URL (browser-safe)
- `STRAPI_API_TOKEN` — server-only read token; **no `NEXT_PUBLIC_` prefix** (would leak to the client bundle)
- `BETTER_AUTH_URL` — same as backend

## Deployment
- **Backend → Strapi Cloud**: https://cloud.strapi.io → connect repo (root `apps/cms`) → set env vars → deploy on push. See https://docs.strapi.io/cloud/getting-started/intro.
- **Frontend → Vercel**: import repo (root `apps/web`), set env vars, deploy.
- **Cross-site cookies (Better Auth)**: set `trustedOrigins` to the Vercel origin and production `defaultCookieAttributes` (SameSite=None; Secure). Update the Google OAuth redirect URI to `<BETTER_AUTH_URL>/api/auth/callback/google`.

## POC acceptance criteria
- [ ] Anonymous visitor can search a trail and read its recent reports against deployed Strapi Cloud.
- [ ] A signed-in user can post a report (rating + note + photo) and see it appear at the top of the trail.
- [ ] A user can edit/delete only their own reports.
- [ ] A moderator can create + publish a Trail in Strapi Cloud and it appears on the frontend.
- [ ] The full loop (read → hike → post) works end-to-end in production.

## Open questions / parked items
- Report flagging / photo moderation — v2.
- Comments on reports — v2.
- Trail `blocks` dynamic zone (gallery/tips/nearby) — v2.
- If Better Auth's beta status becomes a blocker, fall back to stock Users & Permissions (Public/Authenticated roles) — would change M3 and the permissions section.

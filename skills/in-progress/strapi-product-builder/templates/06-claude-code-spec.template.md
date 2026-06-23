# [Product Name] — Claude Code Build Spec

> **Build target**: Strapi v5 (deployed to Strapi Cloud) + [chosen frontend] frontend.
> **Docs lookup**: query the `strapi-docs` MCP first; otherwise WebFetch https://docs.strapi.io.
> **Companion skills**: `strapi-configuration` for scaffolding; `better-auth-setup` for the Better Auth path; `add-page` **only on Astro**; `dockerize-strapi` only if not deploying to Strapi Cloud.

## Project overview
[2-3 sentences from stage 1, plus the one-liner]

## Stack
- Backend / CMS: Strapi v5 (Node ≥ 20)
- Database: PostgreSQL (managed by Strapi Cloud)
- Backend hosting: Strapi Cloud
- Frontend: [Next.js | TanStack Start | Astro | Vue/Nuxt] — from stage 4
- Auth: [Better Auth via `@strapi-community/plugin-better-auth` (beta) | stock Users & Permissions]
- Frontend hosting: [Vercel / Netlify / Cloudflare Pages]
- Styling: Tailwind
- (etc., from stage 4)

## Repo layout
```
project-root/
├── apps/
│   ├── cms/          # Strapi v5
│   └── web/          # [chosen frontend]
├── package.json      # workspaces
└── README.md
```

## Setup commands
```bash
# 1. Strapi backend  (TypeScript is the default; --quickstart is deprecated and
#    conflicts with --dbclient — don't use it. For an automated/non-interactive
#    build, pass --non-interactive + the db flags + --skip-cloud.)
npx create-strapi-app@latest apps/cms \
  --non-interactive --skip-cloud \
  --dbclient=postgres --dbhost=127.0.0.1 --dbport=5432 \
  --dbname=app --dbusername=postgres --dbpassword=postgres
cd apps/cms && npm install   # + auth packages below if using Better Auth

# 2. Frontend — use the scaffold for the framework chosen in stage 4:
#    Next.js:        npx create-next-app@latest apps/web
#    TanStack Start: npx create-start-app@latest apps/web   (verify current CLI)
#    Astro:          npm create astro@latest apps/web
#    Vue/Nuxt:       npx nuxi@latest init apps/web
cd apps/web && npm install @tanstack/react-query   # + better-auth if using Better Auth
```

## Build order

### M1 — Strapi scaffold + Strapi Cloud project linked
**Goal**: Strapi runs locally on Postgres and deploys to Strapi Cloud on push.
**Tasks**:
- [ ] Invoke `strapi-configuration` skill with the schemas below
- [ ] Create Strapi Cloud project at https://cloud.strapi.io, link the repo
- [ ] Set env vars in Strapi Cloud
**Done when**: `npm run develop` boots locally and `git push` triggers a successful Strapi Cloud deploy.

### M2 — Content model
**Tasks**: [per content type, single type, component, dynamic zone]
**Done when**: Admin UI shows everything; permissions match the spec.

### M3 — Auth
**Better Auth path (beta — confirmed in stage 4; follows the official Strapi tutorial: https://strapi.io/blog/strapi-better-auth-tutorial-setup-guide-for-strapi-v5-and-next-js-16):**
- [ ] Prefer the `better-auth-setup` skill (does all of the below). Manual equivalent:
- [ ] `npm install better-auth @strapi-community/plugin-better-auth @strapi-community/plugin-api-permissions @strapi-community/plugin-better-auth-dashboard @better-auth/infra zod@^4.1.12` (zod 4 pin is required)
- [ ] **`npm uninstall @strapi/plugin-users-permissions`** — mandatory; remove it from `package.json` (disabling isn't enough — the plugin throws at boot if the package is present)
- [ ] Enable in `config/plugins.ts`: `'better-auth'`, `'better-auth-dashboard'`, `'api-permissions'` all `{ enabled: true }`
- [ ] Create **`src/lib/auth.ts`** exporting the betterAuth **instance** (`export const auth = betterAuth({ database: strapiAdapter(), advanced: { database: { generateId: 'serial' } }, ... })`) — runtime auto-discovers this file; do NOT use a `() => betterAuth(...)` factory
- [ ] `npx @better-auth/cli generate --config src/lib/auth.ts --yes` to create the `user`/`session`/`account`/`verification` content types (api-permissions needs the `user` type)
- [ ] Set `BETTER_AUTH_SECRET`, `STRAPI_URL` (backend), `CLIENT_URL` (frontend → `trustedOrigins`)
- [ ] Requires Strapi ≥ 5.45; boot and verify `/api/auth/*` mounts (expect to debug — this is a beta/alpha stack)
**Stock U&P path:**
- [ ] Configure Public/Authenticated role permissions per content type
**Done when**: A user can sign up + sign in + sign out via the frontend.

### M4 — Custom controllers / lifecycles / middlewares
[from stage 5]

### M5 — Frontend routes + data fetching
[from stage 5 route tree, in the chosen framework's convention]

### M6 — Auth UI
[auth client (`better-auth/react` or `better-auth/vue`, or U&P) + protected routes]

### M7 — Seed data + media
[use `strapi-configuration` seed flow]

### M8 — Deploy
**Tasks**:
- [ ] Backend: push → Strapi Cloud auto-deploy
- [ ] Frontend: connect host, set env vars, deploy
- [ ] Smoke test the core loop end-to-end
**Done when**: All POC acceptance criteria pass on deployed environments.

## Strapi schemas
[copied from stage 5]

## API surface
[copied from stage 5]

## Auth
- Approach: [Better Auth (beta) | stock Users & Permissions]
- If Better Auth: plugins `@strapi-community/plugin-better-auth` + `@strapi-community/plugin-api-permissions`; config in `src/lib/auth.ts` (`generateId: 'serial'`); Strapi ≥ 5.45
- Providers: ...
- Frontend client: `better-auth/react` (Next.js/TanStack) or `better-auth/vue` (Vue/Nuxt)

## Frontend route/page tree
> Use the chosen framework's convention. Example (TanStack Start, `src/routes/`):
```
apps/web/src/routes/      # Next.js: app/ · Astro: src/pages/ · Nuxt: pages/
├── __root.tsx
├── index.tsx
├── articles/
│   ├── index.tsx
│   └── $slug.tsx
└── (auth)/
    ├── sign-in.tsx
    └── sign-up.tsx
```

## Environment variables

### Strapi (apps/cms)
- `DATABASE_URL` — Postgres (Strapi Cloud injects)
- `APP_KEYS`, `JWT_SECRET`, `ADMIN_JWT_SECRET`, `API_TOKEN_SALT`, `TRANSFER_TOKEN_SALT`
- `BETTER_AUTH_SECRET` — generate with `openssl rand -hex 32` (Better Auth path only)
- `BETTER_AUTH_URL` — public Strapi URL (Better Auth path only)
- (provider-specific)

### Frontend (apps/web)
> Public prefix depends on the framework: `NEXT_PUBLIC_` / `VITE_` / `PUBLIC_` / `NUXT_PUBLIC_`. Shown with `VITE_` — **replace with your stage-4 framework's prefix** (e.g. `NEXT_PUBLIC_STRAPI_URL` for Next.js).
- `VITE_STRAPI_URL` — public Strapi backend URL (browser-safe)
- `STRAPI_API_TOKEN` — server-only read token for SSR fetches; **no public prefix** (would leak to the client bundle)
- `BETTER_AUTH_URL` — same as backend (Better Auth path only)

## Deployment
- **Backend → Strapi Cloud**: https://cloud.strapi.io → connect repo (root `apps/cms`) → set env vars → deploy on push. See https://docs.strapi.io/cloud/getting-started/intro.
- **Frontend → [host]**: ...
- **Better Auth path — cross-site cookies**: frontend and Strapi Cloud are on different domains, so set `trustedOrigins` + production `defaultCookieAttributes` (SameSite=None; Secure). This is the #1 "works locally, breaks in prod" auth bug.

## POC acceptance criteria
- [ ] A user can [first step of core loop] against deployed Strapi Cloud
- [ ] A user can [second step]
- [ ] The full core loop works end-to-end in production
- [ ] An admin can edit content in Strapi Cloud and changes appear on the frontend

## Open questions / parked items
- ...

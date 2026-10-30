<!-- Fill every [bracket] with the content itself, never with "see stage N": the build agent can't open the other stage files. -->
# [Product Name] — Build Spec

> Hand this file to any coding agent (Claude Code, Cursor, etc.) — it is self-contained.
> **Deviation protocol**: commands, structures, and reference conventions in this spec are **user decisions**. If you (the build agent) want to substitute any of them — build friction, a newer API, a "simpler" alternative — STOP and ask the user. Do not silently trade off.

> **Build target**: Strapi v5 (deployed to Strapi Cloud) + [chosen frontend] frontend.
> **Docs lookup**: query the `strapi-docs` MCP first; otherwise WebFetch https://docs.strapi.io. **Frontend**: [chosen framework's docs URL — Next https://nextjs.org/docs / Astro https://docs.astro.build / Nuxt https://nuxt.com/docs / TanStack Start https://tanstack.com/start/latest/docs]. Verify version-sensitive conventions (file names, config keys, async APIs) against the CURRENT major before writing them — legacy compat hides renames (e.g. Next 16: `proxy.ts`, not `middleware.ts`).
> **Self-contained**: build straight from this spec + the official Strapi docs. For the non-obvious v5 controller/ownership/seeding patterns, see the Document Service (https://docs.strapi.io/cms/api/document-service), controllers (https://docs.strapi.io/cms/backend-customization/controllers), and policies (https://docs.strapi.io/cms/backend-customization/policies) docs.

## Project overview
[2-3 sentences from stage 1, plus the one-liner]

## Stack
- Backend / CMS: Strapi v5 (Node [22 | 24] — an LTS that Strapi supports and Strapi Cloud offers)
- Database: PostgreSQL (managed by Strapi Cloud)
- Backend hosting: Strapi Cloud
- Frontend: [Next.js | TanStack Start | Astro | Vue/Nuxt]
- Auth: [stock Users & Permissions (default) | Better Auth via `@strapi-community/plugin-better-auth` (beta, opt-in)]
- Frontend hosting: [Vercel / Netlify / Cloudflare Pages]
- Styling: Tailwind
- [every other stage-4 choice, written out]

## Repo layout
```
project-root/
├── apps/
│   ├── cms/          # Strapi v5 — its own package.json and lockfile
│   ├── web/          # [chosen frontend] — its own package.json and lockfile
│   └── [worker/]     # [any other app from Outside services and other apps — or delete]
├── e2e/              # Playwright suite (M8)
└── README.md
```
> Keep `apps/cms` self-contained, outside any root workspaces. Strapi Cloud builds from that folder and picks the package manager from its lockfile, and it doesn't document workspace support.

## Setup commands
```bash
# 0. Repo first, so a scaffold that creates its own git repo when run outside
#    one (create-next-app does) doesn't nest one inside apps/web.
git init
#    Local Postgres — [how it starts, e.g. Docker, and its version; supported
#    versions: https://docs.strapi.io/cms/configurations/database]

# 1. Strapi backend  (TypeScript is the default; --quickstart is deprecated and
#    conflicts with --dbclient — don't use it. --non-interactive, --no-example and
#    --no-git-init plus the db flags make the run fully non-interactive; the db
#    flags alone still prompt.)
npx create-strapi-app@latest apps/cms \
  --non-interactive --skip-cloud --no-example --no-git-init \
  --dbclient=postgres --dbhost=127.0.0.1 --dbport=5432 \
  --dbname=app --dbusername=postgres --dbpassword=postgres
(cd apps/cms && npm install)   # Better Auth packages are installed in M3, not here:
                               # while Users & Permissions is present, Strapi won't boot with them

# 2. Frontend — the scaffold for the chosen framework, with flags that make it
#    fully non-interactive (it must not prompt). The subshells keep each command
#    in the repo root, so apps/web doesn't end up inside apps/cms.
#    Next.js:        npx create-next-app@latest apps/web --yes [flags for every
#                    option this spec decides — TypeScript, Tailwind, App Router,
#                    src/ or not — named as in the current create-next-app docs]
#                    (--yes fills every option you don't pass from saved
#                    preferences or defaults, which vary by machine)
#    TanStack Start: npx create-start-app@latest apps/web [non-interactive flags]
#    Astro:          npm create astro@latest apps/web [non-interactive flags]
#    Vue/Nuxt:       npx nuxi@latest init apps/web [non-interactive flags]
#    [flags from the framework's current docs — write the exact command here]
(cd apps/web && npm install [@tanstack/react-query (Next.js, TanStack Start) | @tanstack/vue-query (Nuxt) | nothing (Astro)] [better-auth — Better Auth path only])
```

## Build order

> Each "done when" is checkable with what exists by then. Each milestone also builds and checks every item in **Operations** tagged with it. The first milestone that calls an outside service the core loop depends on calls it in test mode; if that fails, **stop and report to the user** before building further.

### M1 — Strapi scaffold + Strapi Cloud project linked
**Goal**: Strapi runs locally on Postgres and deploys to Strapi Cloud on push.
**Tasks**:
- [ ] Start local Postgres and run the setup commands above
- [ ] Commit, and push to a GitHub repo (Strapi Cloud connects through its GitHub app)
- [ ] **User step (needs the Strapi Cloud dashboard):** create the project at https://cloud.strapi.io, pick the plan, link the repo, and under advanced settings set the base directory `apps/cms`, the Node version and the env vars — no `DATABASE_*`; check the Variables tab for defaults
**Done when**: `npm run develop` boots locally and `git push` triggers a successful Strapi Cloud deploy.

### M2 — Content model + permissions
**Tasks**:
- [ ] Create every content type and component from **Strapi schemas** below, copying each `schema.json` as written. Better Auth path: types that relate to the Better Auth `user` (e.g. `author`) wait for M3, because the `user` type doesn't exist until M3's generate step
- [ ] Stock U&P path: never grant `user.find`, `user.findOne` or `user.update` to any role — the frontend reads the current user from `GET /api/users/me` (the stock `PUT /api/users/:id` has no ownership check)
- [ ] Create the admin roles from **Admin roles** below (user step in each environment, after the first admin signs in — unless they're seeded)
- [ ] Stock U&P path: seed the permission matrix from **API surface** in `bootstrap()`, idempotently (find-or-create each grant). The code is the source of truth: a grant removed in the admin panel comes back on the next boot. Custom-route actions are added in M4, when the routes exist. Better Auth path: permissions are seeded in M3, after `plugin-api-permissions` is installed
**Done when**: Admin UI shows everything. Stock U&P path: after two boots on an empty database, every grant in the matrix (except custom-route rows, checked in M4) is present exactly once. Leave U&P's own default grants in place — Public `auth.register`, `auth.callback` and the other auth routes, Authenticated `user.me` and `auth.changePassword` — or sign-up and sign-in break.

### M3 — Auth
**Stock U&P path (default):**
- [ ] Check the permissions seeded in M2, and set the JWT lifetime to match the session lifetime in **Auth** below
- [ ] Seed the U&P settings the admin panel would otherwise hold, from env vars in `bootstrap()` (users-permissions plugin store): the reset-password and email-confirmation URLs under `advanced`, if those flows exist; and, if social login is on, each provider under `grant`. Take field names from what the admin panel saves locally, not from memory
- [ ] If social login is on: **user step** — create the OAuth app in each provider's console (client ID, secret, redirect URL `<Strapi URL>/api/connect/<provider>/callback`); then add the frontend's provider redirect route — see **Auth** below
- [ ] If email confirmation is on: [how a user is confirmed locally — the email provider in test mode, or a mock]
- [ ] Set `strapi::cors` `origin` from env (see **Environments & CI**) — don't rely on the bare default, which allows any origin
**Better Auth path (beta, opt-in — chosen with the user; follows the official Strapi tutorial: https://strapi.io/blog/strapi-better-auth-tutorial-setup-guide-for-strapi-v5-and-next-js-16):**
- [ ] Install + configure Better Auth (steps below follow the official tutorial linked above):
- [ ] `npm install better-auth @strapi-community/plugin-better-auth @strapi-community/plugin-api-permissions @strapi-community/plugin-better-auth-dashboard @better-auth/infra zod@^4.1.12` (zod 4 pin is required)
- [ ] **`npm uninstall @strapi/plugin-users-permissions`** — mandatory; remove it from `package.json` (disabling isn't enough — the plugin throws at boot if the package is present)
- [ ] Enable in `config/plugins.ts`: `'better-auth'`, `'better-auth-dashboard'`, `'api-permissions'` all `{ enabled: true }`
- [ ] Create **`src/lib/auth.ts`** exporting the betterAuth **instance** — runtime auto-discovers this file; do NOT use a `() => betterAuth(...)` factory:
  [the full file, inline: imports (`betterAuth`, `strapiAdapter`), `database: strapiAdapter()`, `secret`, `baseURL`, `trustedOrigins`, `emailAndPassword`, the providers, the cookie settings for the session topology, and `advanced: { database: { generateId: 'serial' } }`]
- [ ] `npx auth@latest generate --config src/lib/auth.ts --yes` to create the `user`/`session`/`account`/`verification` content types (api-permissions needs the `user` type). This step departs from the tutorial: `auth` is the current Better Auth CLI and `@better-auth/cli` is deprecated on npm. `auth` is an unscoped npm name — before running it, check on npm that it's published from the better-auth repository
- [ ] Now create the content types that relate to `user` (deferred from M2). Their relation `target` is the UID of the generated user type — read it from what the generate step created
- [ ] Seed the Public and Authenticated grants in `bootstrap()` through `plugin-api-permissions`. No verified snippet exists yet: fetch the tutorial's Public-role snippet (URL above), extend it to Authenticated, make it find-or-create, and check the result on Settings → API Permissions after two boots
- [ ] Give no role any action on `user`/`session`/`account`/`verification`, and populate a relation to `user` with whitelisted fields only. ⚠️ This rule comes from a design review and hasn't been checked against a running plugin: confirm on Settings → API Permissions after the generate step
- [ ] Set `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CLIENT_URL` and the client `baseURL` for the chosen session topology (see **Auth › Session**), and `BETTER_AUTH_DASHBOARD_SECRET` if the dashboard plugin is installed — locally, and on Strapi Cloud (**user step**) **before pushing**, since every push deploys
- [ ] Set `strapi::cors` `origin` from env (see **Environments & CI**)
- [ ] Find out how a controller reads the signed-in user on this path (U&P sets `ctx.state.user`; check what the Better Auth plugin sets) and write it down here — M4's controllers depend on it
- [ ] Requires Strapi ≥ 5.45; boot and verify `/api/auth/*` mounts (expect to debug — this is a beta/alpha stack)
**Done when** (checked with `curl`; the sign-in UI comes in M6):
- Stock U&P: `POST /api/auth/local/register` and `POST /api/auth/local` return a JWT (after confirming the user, if email confirmation is on), and a request with it gets the Authenticated role's permissions.
- Better Auth: `POST /api/auth/sign-up/email`, `POST /api/auth/sign-in/email` and `POST /api/auth/sign-out` work (paths per Better Auth's email/password docs — check the plugin's mount); a request with the session cookie gets the Authenticated grants; after two boots every matrix grant except custom-route rows is present once.

### M4 — Custom controllers / lifecycles / middlewares
[every controller, policy and middleware, as code or exact steps; a slug-generating Document Service middleware for **every** content type whose `uid` field is filtered on (uid fields aren't filled on API or seed writes); extend the permission seed with each custom route's action] — for server-set fields (e.g. `owner`) and owner-scoped reads, use the **Document Service** (`strapi.documents()`) inside the controller, not body/`ctx.query` mutation (which 400s in v5); apply an `is-owner` policy on `update`/`delete`. Docs: https://docs.strapi.io/cms/api/document-service · https://docs.strapi.io/cms/backend-customization/policies
**Done when**: [custom-route grants present once after two boots; a non-owner gets 403 on `update`/`delete`; `owner` is stamped from the session, not the body; an entry created through the API gets a slug]

### M5 — Frontend routes + data fetching
- [ ] **User step (local):** create the first admin, then a **read-only** API token (Settings → API Tokens) for `STRAPI_API_TOKEN`

[each route in the chosen framework's convention, with the Strapi call behind it and its credential; on core-loop routes, the loading, empty and error states]
**Done when**: [each route renders against local Strapi, including its empty and error states]

### M6 — Auth UI
[auth client (`better-auth/react` for React frameworks, `better-auth/vue` for Nuxt, `better-auth/client` or the island framework's client for Astro; or U&P) + protected routes. Each protected route and server-side handler checks the session on the server before calling Strapi. Proxy topology: the frontend route or host rewrite that forwards `/api/auth/*` to Strapi, built here]
**Done when**: [a user signs up, signs in and out in the browser; a protected route redirects when signed out; password reset works end to end (if in scope); social login works end to end (if on); a browser call from an origin not in the CORS list is refused]

### M7 — Seed data + media
[write a seed script: create content via the **Document Service**; create end-users so passwords hash — through the **U&P user service** (stock path) or Better Auth's `auth.api.signUpEmail` (Better Auth path). Permissions are already seeded by `bootstrap()`. State how it runs — the exact command, and the env var that gates it — and how production gets its day-one content: [the method | none — reason]]
**Done when**: [the seed runs twice without duplicates; seeded users can sign in; seeded entries have slugs, and `filters[slug]` routes find them]

### M8 — E2E suite + deploy
**Tasks**:
- [ ] Turn the POC acceptance criteria below into a Playwright e2e suite (tests inject their own data via the app's real entry points so they're seed-independent; `trace: 'retain-on-failure'`)
- [ ] **User steps, in each deployed environment:** create the first admin; create the admin roles; create a read-only API token and set it on the frontend host; create the Strapi webhook and its secret (if a route refreshes by webhook); create the frontend host project; shared-parent-domain topology: add the custom domains and DNS on both hosts
- [ ] Backend: push → Strapi Cloud auto-deploy
- [ ] Frontend: set env vars on the host, deploy
- [ ] Smoke test the core loop end-to-end
**Done when**: e2e suite green locally; all POC acceptance criteria pass on deployed environments.

## Strapi schemas
[the full `schema.json` for every content type and component, inline. Set `draftAndPublish` explicitly in each — omitted means off. Better Auth path: a relation to the Better Auth user uses the literal placeholder `"target": "<generated Better Auth user UID — set in M3>"`, and its schema is marked "create in M3"]

## API surface
[endpoints, population middlewares, custom routes, the permission matrix (role × action × content type, including `plugin::upload`), and the `bootstrap()` code that seeds it]

## Auth
- Approach: [stock Users & Permissions (default) | Better Auth (beta, opt-in)]
- If Better Auth: plugins `@strapi-community/plugin-better-auth` + `@strapi-community/plugin-api-permissions`; config in `src/lib/auth.ts` (`generateId: 'serial'`); Strapi ≥ 5.45
- Providers: ...
- Frontend client: `better-auth/react` (Next.js/TanStack) · `better-auth/vue` (Vue/Nuxt) · `better-auth/client` or the island framework's client (Astro)
- How a controller reads the signed-in user: [U&P: `ctx.state.user` | Better Auth: as found in M3]
- Session: [topology (shared parent domain | proxy | token held by the frontend's server), cookie flags (`httpOnly`, `secure`, `sameSite`), lifetime, what happens on expiry; on the Better Auth path, the settings from the per-topology table: cookie domain, `BETTER_AUTH_URL`, client `baseURL`, provider redirect URI, `trustedOrigins`, CORS]
- Social login (if on): [the provider flow end to end: the frontend link to `/api/connect/<provider>`, the frontend redirect route that calls `/api/auth/<provider>/callback` with Strapi's session cookie (needs a shared parent domain; a proxy is unverified), and where the JWT is then stored]

### Admin roles
| Role | Can do | How it exists on a fresh database |
|---|---|---|
| [Editor] | [edit Trails, Regions] | [user step after the first admin signs in] |
| [Moderator] | [hide Reports: unpublish, or set `hidden`, which the controller filters out] | [user step] |

## Outside services
[each service: what it's for, its env var names, what users see when it fails, and its test mode (test key, local mock via the SDK's base-URL setting, or stub)]

## Frontend routes
| Route | Access | Data and credential | Rendering (and refresh) | States (core loop) |
|---|---|---|---|---|
| [`/`] | [public] | [`GET /api/page?…` — read-only token, server] | [built ahead; refreshed by a Strapi webhook to `/api/revalidate`] | — |
| [`/articles/[slug]`] | [public] | [`GET /api/articles?filters[slug][$eq]=…` — read-only token, server] | [per request] | [loading · empty · error · not found] |

> A webhook refresh needs its route and a shared secret: list both, the secret under **Environment variables**, and the Strapi webhook (URL, the header carrying the secret, events) under **Environments & CI** — it lives in Strapi's database, so each environment creates it.

### Server-side handlers
| Handler | Calls Strapi with | Checks first |
|---|---|---|
| [`app/api/comments/route.ts` POST] | [the user's JWT, from the session cookie] | [session present, else 401; owner taken from the session] |

### Route tree
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
> Give a local and a production example value for every auth and CORS variable (never real secrets).

### Strapi (apps/cms)
- `DATABASE_*` — local Postgres only; **set none on Strapi Cloud** (any of them switches Cloud to an external database)
- `APP_KEYS`, `JWT_SECRET`, `ADMIN_JWT_SECRET`, `API_TOKEN_SALT`, `TRANSFER_TOKEN_SALT`, `ENCRYPTION_KEY` — the docs say these are generated; check `.env` has them (`JWT_SECRET` was seen missing once). On Strapi Cloud, check the Variables tab for defaults before adding your own
- `BETTER_AUTH_SECRET` — generate with `openssl rand -hex 32` (Better Auth path only)
- `BETTER_AUTH_URL` — the public auth origin for the session topology: custom API domain, or the frontend's origin under the proxy; never `*.strapiapp.com` (Better Auth path only)
- `CLIENT_URL` — frontend URL → `trustedOrigins` (Better Auth path only)
- `BETTER_AUTH_DASHBOARD_SECRET` — only with the dashboard plugin; a real value, not the README's fallback
- [the CORS origins variable read by `config/middlewares.ts`] — local: `http://localhost:3000` · production: [the deployed frontend origins | empty — every call goes through the frontend's server]
- Stock U&P path: [the reset-password URL, the email-confirmation URL, and each social provider's client ID and secret — the values `bootstrap()` seeds into the plugin store]
- (provider-specific)

### Frontend (apps/web)
> `<PUBLIC>` is a placeholder for the chosen framework's public prefix — `NEXT_PUBLIC_` (Next.js) / `VITE_` (TanStack Start, Vite) / `PUBLIC_` (Astro) / `NUXT_PUBLIC_` (Nuxt). **Substitute the real prefix when writing the spec** — never leave `<PUBLIC>` (or a wrong-framework prefix) in the output.
- `<PUBLIC>STRAPI_URL` — public Strapi backend URL (browser-safe)
- `STRAPI_API_TOKEN` — server-only read token for SSR fetches; **no public prefix** (would leak to the client bundle)
- `<PUBLIC>AUTH_BASE_URL` — Better Auth **client** `baseURL` = the origin the browser sends auth calls to (Strapi's, or the frontend's own under the proxy topology) **+ `/api/auth`** (browser-safe; Better Auth path only)
- [the webhook-refresh secret, if a route refreshes by webhook — server-only]

## Deployment
- **Backend → Strapi Cloud**: https://cloud.strapi.io → plan → connect repo → advanced settings: base directory `apps/cms`, Node version, env vars (no `DATABASE_*`) → deploy on push. See https://docs.strapi.io/cloud/getting-started/deployment.
- **Frontend → [host]**: ...
- **Session across sites**: [the chosen topology, configured]. The frontend and Strapi are on different sites, so a cookie Strapi sets is third-party and Safari drops it, even with `SameSite=None; Secure`. This is the #1 "works locally, breaks in prod" auth bug.
- **CORS**: `strapi::cors` in `config/middlewares.ts` sets `origin` to [the exact deployed origins whose browsers call Strapi | `[]` — every call goes through the frontend's server]. Never leave it bare: the default is `origin: '*'` with `credentials: true`.

## Environments & CI
- [local | preview | production]: frontend → [which Strapi]; preview deploys write to [their own Strapi | nothing | production — reason]
- Preview sign-in: [how previews sign in — with a shared parent domain, previews on `*.vercel.app` can't use the auth cookie]
- Strapi webhooks: [URL, header carrying the secret, events] — **user step**: create in Settings → Webhooks in each environment
- CI: [what runs on each push] | N/A — [reason]

## Operations
[each robustness-sweep item the user accepted, the milestone that builds it, and how it's checked — e.g. "unique `slug` index — M2 — inserting a duplicate fails"]

## POC acceptance criteria
- [ ] A user can [first step of core loop] against deployed Strapi Cloud
- [ ] A user can [second step]
- [ ] The full core loop works end-to-end in production
- [ ] An admin can edit content in Strapi Cloud and changes appear on the frontend

## Open questions / parked items
- Riskiest assumption: [from the product brief] — how the POC tests it: [...]
- ...

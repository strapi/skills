# Deploying Strapi to Strapi Cloud

This is the default deployment target for any project produced by this skill. Use this reference when writing the **Deployment** section of stage 6, or when the user asks "how do I deploy?".

> Always verify the latest steps against https://docs.strapi.io/cloud/getting-started/intro before pasting commands into a build spec — Strapi Cloud's onboarding flow evolves. Use the `strapi-docs` MCP if available.

## What Strapi Cloud gives you

- Managed Strapi v5 runtime (Node, framework upgrades handled)
- Managed PostgreSQL
- Built-in media CDN (uploads work out of the box, no S3/R2 to configure)
- Deploy on `git push` to a connected branch
- Environment variables UI
- Default environment variables, listed with your own in the project's **Variables** tab (the docs don't say which ones, so check the tab before adding secrets)
- Custom domains, on every plan

## Prerequisites

- A Strapi v5 project that builds locally (`npm run build` succeeds)
- The scaffold's `config/database.ts`. Strapi Cloud provides its own PostgreSQL database (https://docs.strapi.io/cloud/advanced/database); set **no** `DATABASE_*` variables on Cloud, because any of them switches the project to an external database
- A self-contained Strapi folder: its own `package.json` and lockfile. Cloud picks the package manager from the lockfile and doesn't document npm/yarn workspaces (a 2025 reply on its feedback board says workspace support isn't on the roadmap), so keep the Strapi app outside any root workspaces
- Code pushed to a GitHub repo (Strapi Cloud connects via GitHub App)

## Steps

The order follows https://docs.strapi.io/cloud/getting-started/deployment (checked 2026-10-29).

1. Sign in at https://cloud.strapi.io and **Create project**.
2. Pick a **plan**. There is no free plan. The entry plan sleeps when idle and has no backups: fine for a POC, not for a product people depend on. While it sleeps, cron tasks can't run and the first request, including a webhook, waits for it to wake. Higher plans stay on and add backups. Check https://strapi.io/pricing-cloud — plans and prices change.
3. **Connect the GitHub repository** and pick the branch.
4. Set the project name and a **region** close to your primary users. Then, under **Show advanced settings**:
   - the **base directory**, if Strapi lives in a subfolder (e.g. `apps/cms`);
   - the **Node version** (Cloud offered 22 and 24 as of October 2026);
   - the environment variables (next step).
5. Set **environment variables** — gate on the stage-4 auth choice:
   - Cloud's defaults show in the **Variables** tab. Check there before adding `APP_KEYS`, `JWT_SECRET`, `ADMIN_JWT_SECRET`, `API_TOKEN_SALT`, `TRANSFER_TOKEN_SALT` or `ENCRYPTION_KEY` yourself (`ENCRYPTION_KEY` lets admins view API tokens again after creation). Never add `DATABASE_*`
   - Any provider keys (e.g., `GOOGLE_CLIENT_ID`, `STRIPE_SECRET_KEY`)
   - The CORS origins variable read by `config/middlewares.ts` (both paths)
   - **Stock U&P path:** `PUBLIC_URL` (if email confirmation or social login is on — Strapi's public URL, read as `url` in `config/server.ts`), and the values `bootstrap()` seeds into the U&P plugin store: the reset-password and confirmation URLs, and each provider's client ID, secret and frontend redirect URL
   - **Better Auth path only:**
     - `BETTER_AUTH_SECRET` (generate with `openssl rand -hex 32`)
     - `BETTER_AUTH_DASHBOARD_SECRET` (only with the dashboard plugin; generate with `openssl rand -hex 32` — the README's example falls back to a hard-coded key)
     - `BETTER_AUTH_URL` (the Better Auth `baseURL`, per the session topology: the custom API domain (e.g. `https://api.example.com`), or the frontend's origin under the proxy — not `*.strapiapp.com`, which Safari treats as third-party)
     - `CLIENT_URL` (the frontend public URL → `trustedOrigins`)
     - `AUTH_COOKIE_DOMAIN` (shared parent domain only: the parent domain, e.g. `example.com`)
6. **Deploy**. First deploy takes a few minutes (build + migrations).
7. Right after the first deploy, open the admin URL (`https://<project>.strapiapp.com/admin`) and create the first admin user. Until you do, anyone who opens it can register as super admin.
8. **Check** the content-API permissions that `bootstrap()` seeded — `Public`/`Authenticated` roles under Users & Permissions on the stock path, or Settings → API Permissions (`plugin-api-permissions`) on the Better Auth path. Change them in code, not here: the seed restores missing grants on every boot.
9. Create API tokens (Settings → API Tokens) for any frontend that needs read access: a **custom** token holding only the `find`/`findOne` actions it calls. Not the read-only type: it allows every `find` route, including `GET /api/users`, which lists every account's email.

## Updating after first deploy

- `git push` to the connected branch → automatic redeploy.
- Schema changes (new content types, fields) get picked up on deploy. **Always test the migration locally first** with a dump of the production DB if data shape matters.
- Plugins added in `package.json` get installed on next deploy.

## Common gotchas

- **First deploy 500s on `/admin`** — usually an `APP_KEYS` length mismatch. If you copied values from a local `.env` into the Cloud settings, remove them and check what the Variables tab lists as defaults.
- **Don't grant Public the upload plugin's `find`** to fix missing images: it lists every file in the media library. Media fields populate without it; if images are missing, check that the request populates the field.
- **Better Auth callback URL mismatch** (Better Auth path only) — `BETTER_AUTH_URL` (used as `baseURL` in `src/lib/auth.ts`) must equal the public auth origin for the chosen session topology exactly (including `https://`, no trailing slash) — a custom API domain or the frontend's origin, not `*.strapiapp.com`. Update OAuth provider redirect URIs to `<BETTER_AUTH_URL>/api/auth/callback/<provider>`.
- **CORS** — set `config/middlewares.ts` `strapi::cors` `origin` to exactly the frontend origins whose browsers call Strapi (`[]` if every call goes through the frontend's server). A bare `strapi::cors` defaults to `origin: '*'` with `credentials: true`. Never `*` with credentials; limit preview-deploy patterns to domains you control.

## When NOT to use Strapi Cloud

If the user opted out in stage 4 (data-residency, on-prem requirement, cost ceiling), spec a Dockerfile + `docker-compose` (Postgres) instead (see the Strapi Docker guide on https://docs.strapi.io) and pick a host (Render, Railway, Fly.io, AWS ECS, plain VPS). Update the stage-6 Deployment section accordingly and remove Strapi Cloud-specific env-var notes.

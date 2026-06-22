# Deploying Strapi to Strapi Cloud

This is the default deployment target for any project produced by this skill. Use this reference when writing the **Deployment** section of stage 6, or when the user asks "how do I deploy?".

> Always verify the latest steps against https://docs.strapi.io/cloud/getting-started/intro before pasting commands into a build spec — Strapi Cloud's onboarding flow evolves. Use the `strapi-docs` MCP if available.

## What Strapi Cloud gives you

- Managed Strapi v5 runtime (Node, framework upgrades handled)
- Managed PostgreSQL
- Built-in media CDN (uploads work out of the box, no S3/R2 to configure)
- Deploy on `git push` to a connected branch
- Environment variables UI
- Project-level secrets (`APP_KEYS`, `JWT_SECRET`, etc.) generated for you on first deploy

## Prerequisites

- A Strapi v5 project that builds locally (`npm run build` succeeds)
- Postgres-compatible DB config in `config/database.ts` (Strapi Cloud injects `DATABASE_URL`)
- Code pushed to a GitHub repo (Strapi Cloud connects via GitHub App)

## Steps

1. Sign in at https://cloud.strapi.io.
2. **Create project** → **Connect GitHub repository** → pick the repo and branch.
3. Set the **root directory** if Strapi lives in a subfolder of a monorepo (e.g., `apps/cms`).
4. Choose a **region** close to your primary users.
5. Pick a **plan** (free tier is fine for POCs; paid tiers add custom domains, more resources, backups).
6. Set **environment variables** — at minimum:
   - `BETTER_AUTH_SECRET` (generate with `openssl rand -base64 32`)
   - `BETTER_AUTH_DASHBOARD_SECRET` (generate with `openssl rand -base64 32`)
   - `STRAPI_URL` (the Strapi Cloud public URL — set after first deploy)
   - `CLIENT_URL` (the frontend public URL)
   - Any provider keys (e.g., `GOOGLE_CLIENT_ID`, `STRIPE_SECRET_KEY`)
   - Strapi Cloud auto-injects: `DATABASE_URL`, `APP_KEYS`, `JWT_SECRET`, `ADMIN_JWT_SECRET`, `API_TOKEN_SALT`, `TRANSFER_TOKEN_SALT`, `HOST`, `PORT`
7. **Deploy**. First deploy takes a few minutes (build + migrations).
8. Open the admin URL (`https://<project>.strapiapp.com/admin`) and create the first admin user.
9. Configure permissions for the `Public` and `Authenticated` roles per the stage-5 spec.
10. Generate API tokens (Settings → API Tokens) for any frontend that needs read access.

## Updating after first deploy

- `git push` to the connected branch → automatic redeploy.
- Schema changes (new content types, fields) get picked up on deploy. **Always test the migration locally first** with a dump of the production DB if data shape matters.
- Plugins added in `package.json` get installed on next deploy.

## Common gotchas

- **First deploy 500s on `/admin`** — usually `APP_KEYS` length mismatch. Strapi Cloud handles this for you, but if you copied a `.env` from local, clear those vars from the Cloud env settings so Cloud's auto-generated values win.
- **Media URLs return 403** — make sure `Public` role has read permission on the upload plugin's `find` action.
- **Better Auth callback URL mismatch** — `STRAPI_URL` (used as `baseURL` in `src/lib/auth.ts`) must equal the Strapi Cloud public URL exactly (including `https://`, no trailing slash). Update OAuth provider redirect URIs to `<STRAPI_URL>/api/auth/callback/<provider>`.
- **CORS** — set `config/middlewares.ts` `strapi::cors` `origin` to your frontend host(s). Don't use `*` in production.

## When NOT to use Strapi Cloud

If the user opted out in stage 4 (data-residency, on-prem requirement, cost ceiling), use the `dockerize-strapi` skill instead and pick a host (Render, Railway, Fly.io, AWS ECS, plain VPS). Update the stage-6 Deployment section accordingly and remove Strapi Cloud-specific env-var notes.

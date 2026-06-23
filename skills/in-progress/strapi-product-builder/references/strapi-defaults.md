# Default stack — opinions

These are the defaults this skill uses unless the user overrides them in stage 4. Each line includes *why* so the override conversation has a real basis.

| Area | Default | Why |
|---|---|---|
| Backend / CMS | **Strapi v5** | Headless CMS with admin UI, REST + GraphQL, content types map cleanly from stage-3 entities. |
| Database | **PostgreSQL** | Strapi's recommended production DB. Strapi Cloud manages it for you. SQLite is fine *only* for local dev — never spec it for production. |
| Backend hosting | **Strapi Cloud** | Zero-infra managed Strapi: deploy on push, automated upgrades, built-in CDN/media, Postgres included. Dashboard: https://cloud.strapi.io. Docs: https://docs.strapi.io/cloud/getting-started/intro |
| API style | **Strapi REST** with route middlewares for default population | Matches Strapi's defaults. Add the GraphQL plugin only if the frontend has a real reason. |
| Frontend | **User's choice — always ask** | Strapi is headless, so any frontend works. This skill is *optimized* for four: **Next.js, TanStack Start, Astro, Vue/Nuxt**. No silent default — pick in stage 4. See `frontend-frameworks.md`. |
| Auth | **`@strapi-community/plugin-better-auth`** ⚠️ *beta — confirm first* | Brings Better Auth (https://better-auth.com) into Strapi: modern session/social/2FA. **The plugin is in beta and its maintainers say not to use it in production** (needs Strapi ≥ 5.45, removes Users & Permissions). Default to it only after the user confirms in stage 4; otherwise use stock U&P. See `auth-better-auth.md`. Plugin repo: https://github.com/strapi-community/plugin-better-auth |
| Frontend hosting | open — Vercel, Netlify, Cloudflare Pages | User choice. TanStack Start has adapters for all three. |
| Styling | **Tailwind** | Common default for Strapi + frontend projects. |
| CI/CD | Strapi Cloud (auto deploy on push) for backend; host-native for frontend | No GitHub Actions needed for the basic case. |

## When to deviate

- **User needs offline-first sync, edge-only, or fully serverless** → Strapi may not fit. Surface this in stage 4 and discuss alternatives honestly.
- **User has compliance/data-residency needs Strapi Cloud doesn't meet** → keep Strapi v5, switch to self-hosted (Docker on the user's own infra). Spec the Dockerfile + `docker-compose` (Postgres) in stage 6 instead of the Strapi Cloud deploy step (see the Strapi Docker guide on https://docs.strapi.io).
- **Frontend** → there is no default; ask. Optimized paths exist for Next.js, TanStack Start, Astro, and Vue/Nuxt (see `frontend-frameworks.md`); SvelteKit/SolidStart/Remix/etc. also work — just look up that framework's scaffold/routing/env conventions. Strapi is framework-agnostic; only the frontend artifacts in stages 5-6 change.
- **User wants a production launch now, or is on Strapi < 5.45** → skip the beta better-auth plugin; use stock **Users & Permissions** (Public/Authenticated roles). Document the chosen auth in stage 5.
- **User is committed to NextAuth/Clerk/Auth0** → skip the better-auth plugin. Document the chosen auth in stage 5 instead.

## Things to never quietly default

- Email provider — always ask. Mail config breaks easily; "I assumed SendGrid" is not a great answer.
- Payment provider — always ask.
- Cron / background jobs — Strapi Cloud has limits on long-running work. If the spec needs heavy async, surface it explicitly.

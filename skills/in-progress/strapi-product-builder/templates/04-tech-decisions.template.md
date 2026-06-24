# Tech Decisions

For each decision: what was chosen, what other options were considered, and why this one fits the requirements.

## Defaults applied (this skill is opinionated — confirm or override)

- **Backend / CMS**: Strapi v5 ✅
- **Database**: PostgreSQL ✅
- **Backend hosting**: Strapi Cloud ✅
- **Frontend**: _user's choice — pick one_ (first-class: Next.js / TanStack Start / Astro / Vue-Nuxt; other: ___)
- **Auth**: `@strapi-community/plugin-better-auth` ⚠️ *beta, not for production per maintainers; needs Strapi ≥ 5.45; removes Users & Permissions* — confirmed: yes/no. If no → stock Users & Permissions
- **Styling**: Tailwind ✅

## Backend / CMS
- **Choice**: Strapi v5 (Node 20+)
- **Plugins anticipated**: Better Auth, [GraphQL?, i18n?, custom fields?]
- **Why**: [requirements link]

## Database
- **Choice**: PostgreSQL (managed by Strapi Cloud)
- **Why**: ...

## Backend hosting
- **Choice**: Strapi Cloud
- **Region**: ...
- **Plan**: ...
- **Why**: ...

## Frontend framework
- **Choice**: [Next.js | TanStack Start | Astro | Vue/Nuxt | other]
- **Considered**: ...
- **Why**: ...
- **Routes live in**: [`app/` | `src/routes/` | `src/pages/` | `pages/`]  ·  **Public env prefix**: [`NEXT_PUBLIC_` | `VITE_` | `PUBLIC_` | `NUXT_PUBLIC_`]

## Frontend hosting
- **Choice**: [Vercel | Netlify | Cloudflare Pages | other]
- **Why**: ...

## Auth
- **Choice**: [`@strapi-community/plugin-better-auth` (beta) | stock Users & Permissions | Clerk/Auth0/...]
- **If Better Auth**: acknowledged beta/not-for-production; Strapi ≥ 5.45; U&P removed; content-API perms via `@strapi-community/plugin-api-permissions`
- **Providers enabled**: email/password, [Google, GitHub, ...]
- **Why**: ...

## Media / file storage
- **Choice**: Strapi Cloud media (default) | [S3 | R2 | Cloudinary if self-hosted]
- **Why**: ...

## CI/CD
- **Backend**: Strapi Cloud auto-deploy on push
- **Frontend**: [host-native | GitHub Actions]

## Email / notifications
- **Choice**: ...
- **Why**: ...

## Payments
- **Choice**: [Stripe | Lemon Squeezy | Paddle | n/a]
- **Why**: ...

## Analytics & monitoring
- **Choice**: [PostHog | Plausible | Sentry | ...]

## MCP server (AI agent access)
- **Enabled**: no (default) | yes — only if the product needs AI agents to read/write its content
- **If yes**: Strapi v5.47+ built-in MCP server (**beta**); `mcp.enabled` in `config/server`; endpoint `POST /mcp`; scoped Admin API token; custom tools via a plugin (`strapi.ai.mcp`)
- **Why**: ...

## Styling
- **Choice**: Tailwind
- **Component library**: [shadcn/ui | none | other]

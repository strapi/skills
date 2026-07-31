# Tech Decisions

For each decision: what was chosen, what other options were considered, and why.

## Defaults applied (this skill is opinionated — confirmed or overridden)

- **Backend / CMS**: Strapi v5 ✅
- **Database**: PostgreSQL ✅
- **Backend hosting**: Strapi Cloud ✅
- **Frontend**: **Next.js (App Router)** — chosen over the TanStack Start default (see below)
- **Auth**: `@strapi-community/plugin-better-auth` ⚠️ *beta, not for production per maintainers; needs Strapi ≥ 5.45; removes Users & Permissions* — **confirmed: yes** (this is a community POC, social login wanted)
- **Styling**: Tailwind ✅

## Backend / CMS
- **Choice**: Strapi v5 (Node ≥ 20)
- **Plugins anticipated**: better-auth + api-permissions (auth), upload (media, built in)
- **Why**: editorial Trails + user-generated Reports map cleanly to collection types; admin UI gives moderators a no-code editing surface (Priya's JTBD).

## Database
- **Choice**: PostgreSQL (managed by Strapi Cloud)
- **Why**: production default; Better Auth's `generateId: 'serial'` matches Postgres integer IDs.

## Backend hosting
- **Choice**: Strapi Cloud
- **Region**: closest to the local user base
- **Plan**: free tier for the POC
- **Why**: zero infra, bundled media CDN (report photos work out of the box), deploy-on-push.

## Frontend framework
- **Choice**: Next.js (App Router)
- **Considered**: TanStack Start (skill's headline option), Astro
- **Why**: the team already knows Next.js; public trail/report pages benefit from Server Components + caching for fast public reads. Astro was tempting for the mostly-read pages but the posting flow + auth UI is app-like enough to favor Next.js.
- **Routes live in**: `app/`  ·  **Public env prefix**: `NEXT_PUBLIC_`

## Frontend hosting
- **Choice**: Vercel
- **Why**: first-class Next.js host. Note: Vercel + Strapi Cloud = different domains → cross-site cookies for Better Auth (handled in stage 5/6).

## Auth
- **Choice**: `@strapi-community/plugin-better-auth` (beta)
- **Acknowledged**: beta/not-for-production; Strapi ≥ 5.45; U&P removed; content-API perms via `@strapi-community/plugin-api-permissions`
- **Providers enabled**: email/password + Google
- **Why**: wants Google sign-in and a clean session model; this is a community POC where beta risk is acceptable. (If this were a funded production launch, stock U&P would be the safer call.)

## Media / file storage
- **Choice**: Strapi Cloud media (default)
- **Why**: report photos and trail hero images; bundled CDN, no S3 to configure.

## CI/CD
- **Backend**: Strapi Cloud auto-deploy on push
- **Frontend**: Vercel git integration

## Email / notifications
- **Choice**: Resend (transactional: verification + password reset)
- **Why**: simple API, generous free tier; only transactional mail in MVP.

## Payments
- **Choice**: n/a — free community product.

## Analytics & monitoring
- **Choice**: Plausible (privacy-friendly page analytics); Sentry on the frontend later.

## Styling
- **Choice**: Tailwind
- **Component library**: shadcn/ui for the auth forms and report dialog.

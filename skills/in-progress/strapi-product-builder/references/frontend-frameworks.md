# Frontend frameworks — the skill is framework-independent

Strapi is a headless backend, so the frontend is the user's choice. **Ask in stage 4; never assume.** This skill is *optimized* for four frameworks — it knows the scaffold command, route convention, public-env-var prefix, and hosting story for each — but any framework that can call a REST/GraphQL API works.

> Verify scaffold commands against each framework's current docs before pasting into a build spec — scaffolding CLIs change often.

## The four first-class options

| Framework | Best for | Scaffold | Routes live in | Public env prefix | Companion skill |
|---|---|---|---|---|---|
| **Next.js** (App Router) | The default for most app-style products; biggest ecosystem, React Server Components | `npx create-next-app@latest` | `app/` (file-based) | `NEXT_PUBLIC_` | — (the `better-auth-setup` skill wires Next.js directly) |
| **TanStack Start** | Type-safe full-stack React on Vite, file-based routes + loaders | `npx create-start-app@latest` (verify; TanStack CLI is moving) | `src/routes/` | `VITE_` | — |
| **Astro** | Content-heavy / mostly-static **public** sites (marketing, blogs, docs). For authenticated or interactive content *apps*, prefer Next.js | `npm create astro@latest` | `src/pages/` (file-based) | `PUBLIC_` | **`add-page`** (Astro-only — only recommend it on this path) |
| **Vue / Nuxt** | Vue teams; Nuxt gives SSR + file-based routing | `npx nuxi@latest init` (Nuxt) | `pages/` (Nuxt) | `NUXT_PUBLIC_` (Nuxt) / `VITE_` (plain Vue) | — |

If the user wants something else (SvelteKit, SolidStart, Remix, plain React SPA, mobile/Expo), support it — just look up that framework's scaffold + routing + env conventions and parameterize the same four things below.

## The four things that change per framework

When you write stages 5 and 6, **parameterize these by the chosen framework** instead of hard-coding TanStack Start:

1. **Scaffold command** — from the table above.
2. **Route/page tree shape** — `app/` (Next.js), `src/routes/` (TanStack Start), `src/pages/` (Astro), `pages/` (Nuxt).
3. **Public env-var prefix** — this is a correctness *and* security issue. Only values safe to ship to the browser get the public prefix:
   - Next.js → `NEXT_PUBLIC_STRAPI_URL`
   - TanStack Start / Vite → `VITE_STRAPI_URL`
   - Astro → `PUBLIC_STRAPI_URL`
   - Nuxt → `NUXT_PUBLIC_STRAPI_URL`
   - **A server-only secret (e.g. a Strapi API token used in SSR loaders) must NOT carry the public prefix.** Name it `STRAPI_API_TOKEN` (no prefix) so it stays server-side. A `VITE_`/`NEXT_PUBLIC_`-prefixed token is bundled into client JS and leaks to every visitor.
4. **Auth client wiring** — `better-auth` ships framework clients (`better-auth/react` for Next.js/TanStack/plain React, `better-auth/vue` for Vue/Nuxt). The `baseURL` points at the Strapi backend origin (Better Auth mounts under `/api/auth`). See `auth-better-auth.md`.

## Data fetching pattern per framework (high level)

- **Next.js** — Server Components / Route Handlers fetch Strapi server-side; use `fetch` with `next: { revalidate }` or `cache`. Client components use TanStack Query if needed.
- **TanStack Start** — route `loader`s fetch Strapi; TanStack Query for client refetches.
- **Astro** — fetch in the frontmatter (`---`) at build/SSR time; islands for interactivity.
- **Nuxt** — `useFetch` / `useAsyncData` in pages; server routes (`server/api/`) to proxy authenticated calls.

## Hosting

All four deploy cleanly to **Vercel, Netlify, or Cloudflare** (Astro and Nuxt also do static export where applicable). Pick in stage 4. The Strapi backend hosting (Strapi Cloud by default) is independent of this choice.

## Cross-site cookies (read this for the auth path)

With the default architecture — frontend on Vercel/Netlify + Strapi on Strapi Cloud — the frontend and backend sit on **different registrable domains**, so Better Auth session cookies are **cross-site by default**. This is the normal case here, not an edge case. Whatever framework you pick, the auth setup needs cross-site cookie config (`defaultCookieAttributes`, `trustedOrigins`) — see `auth-better-auth.md`.

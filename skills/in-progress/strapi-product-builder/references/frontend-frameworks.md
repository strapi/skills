# Frontend frameworks — the skill is framework-independent

Strapi is a headless backend, so the frontend is the user's choice. **Ask in stage 4; never assume.** This skill is *optimized* for four frameworks — it knows the scaffold command, route convention, public-env-var prefix, and hosting story for each — but any framework that can call a REST/GraphQL API works.

> Verify scaffold commands against each framework's current docs before pasting into a build spec — scaffolding CLIs change often.
>
> **Verify conventions on new majors — not just scaffolds.** Frameworks rename file conventions and config keys across majors, and backwards compatibility hides staleness from every automated check (typecheck, boot, and tests all pass on the legacy name). The patterns you'd write from memory are exactly the ones to check. Known instance: **Next 16 renamed `middleware.ts` → `proxy.ts`** (`export default function proxy()`); the legacy name still works, so nothing flags it. Framework docs: Next https://nextjs.org/docs · Astro https://docs.astro.build · Nuxt https://nuxt.com/docs · TanStack Start https://tanstack.com/start/latest/docs. The stage-6 spec must carry the chosen framework's docs link alongside Strapi's.

## The four first-class options

| Framework | Best for | Scaffold | Routes live in | Public env prefix | Official starter / ref |
|---|---|---|---|---|---|
| **Next.js** (App Router) | The default for most app-style products; biggest ecosystem, React Server Components | `npx create-next-app@latest` | `app/` (file-based) | `NEXT_PUBLIC_` | [strapi/LaunchPad](https://github.com/strapi/LaunchPad) — official Next.js + Strapi demo |
| **TanStack Start** | Type-safe full-stack React on Vite, file-based routes + loaders | `npx create-start-app@latest` (verify; TanStack CLI is moving) | `src/routes/` | `VITE_` | — |
| **Astro** | Content-heavy / mostly-static **public** sites (marketing, blogs, docs). For authenticated or interactive content *apps*, prefer Next.js | `npm create astro@latest` | `src/pages/` (file-based) | `PUBLIC_` | — |
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
4. **Auth client wiring** — `better-auth` ships framework clients (`better-auth/react` for Next.js/TanStack/plain React, `better-auth/vue` for Vue/Nuxt). The client `baseURL` is the **origin the browser sends auth calls to + `/api/auth`** (e.g. `https://api.example.com/api/auth` with a shared parent domain, or the frontend's own origin under a proxy — see the cross-site section below), read from a public-prefixed env var — a bare origin is the most common "client can't reach auth" bug. (The backend's `BETTER_AUTH_URL` is a bare origin; only the client value carries the suffix.) See `auth-better-auth.md`.

## Data fetching pattern per framework (high level)

- **Next.js** — Server Components / Route Handlers fetch Strapi server-side; use `fetch` with `next: { revalidate }` or `cache`. Client components use TanStack Query if needed.
- **TanStack Start** — route `loader`s fetch Strapi; TanStack Query for client refetches.
- **Astro** — fetch in the frontmatter (`---`) at build/SSR time; islands for interactivity.
- **Nuxt** — `useFetch` / `useAsyncData` in pages; server routes (`server/api/`) to proxy authenticated calls.

## Hosting

All four deploy cleanly to **Vercel, Netlify, or Cloudflare** (Astro and Nuxt also do static export where applicable). Pick in stage 4. The Strapi backend hosting (Strapi Cloud by default) is independent of this choice.

## Cross-site cookies (read this for the auth path)

With the default architecture — frontend on Vercel/Netlify/Cloudflare + Strapi on Strapi Cloud — the frontend and backend sit on **different sites**, so a cookie Strapi sets is **third-party** to the frontend, and Safari blocks third-party cookies by default — `SameSite=None; Secure` doesn't get around that. And because `vercel.app`, `netlify.app`, `pages.dev` and `strapiapp.com` are on the Public Suffix List (https://publicsuffix.org), no cookie can be shared across them: the only shared parent domain is a custom one. This is the normal case here, not an edge case. Decide the session topology in stage 4: a shared parent domain (custom domains), a proxy through the frontend's server, or a token held by the frontend's server (fits stock U&P with email/password; U&P social login needs the shared parent domain — a proxy is unverified there). See `auth-better-auth.md` for the Better Auth side, and the cookbook for U&P social login.

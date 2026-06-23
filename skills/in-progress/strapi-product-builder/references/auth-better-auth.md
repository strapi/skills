# Auth — Better Auth via the strapi-community plugin

Default auth approach for any project this skill produces. Reference when filling in stage 5 (auth flows, permissions) and stage 6 (M3 milestone).

- Plugin repo: https://github.com/strapi-community/plugin-better-auth
- Plugin docs: https://strapi-community.github.io/plugin-better-auth/
- Better Auth docs: https://better-auth.com
- Strapi Users & Permissions docs (for the underlying role model): https://docs.strapi.io/cms/features/users-permissions
- Official Strapi Better Auth tutorial: https://strapi.io/blog/strapi-better-auth-tutorial-setup-guide-for-strapi-v5-and-next-js-16

> ⚠️ **BETA — confirm with the user before defaulting to this.** The maintainers state the plugin is in **beta** and **"should not be used in production"**, with Strapi v5 support marked *experimental*. It's an excellent choice for prototypes/POCs and when you want social login, 2FA, magic links, or passkeys without hand-rolling them. For a production launch on a tight timeline, stock **Users & Permissions** (below) is the conservative fallback. Always state the beta status in stage 4 and get an explicit yes before writing it into the spec.

> Plugin APIs and config keys evolve. Always check the plugin docs/README before pasting install commands or config snippets into a build spec.

## Requirements

- **Strapi ≥ 5.45.0** and **Node ≥ 20**. If the project pins an older Strapi, this plugin won't work — fall back to Users & Permissions.
- **It requires removing Users & Permissions — this is a hard boot requirement, not a suggestion.** Verified empirically: with `@strapi/plugin-users-permissions` still installed, Strapi **refuses to boot** — *"The 'users-permissions' plugin is installed. Better Auth and users-permissions cannot be used together."* So you must `npm uninstall @strapi/plugin-users-permissions`. Consequently the "Public / Authenticated U&P role" model in `content-modeling.md` and the stage-5 permissions template **does not apply on this path** — content-API permissions are governed by the companion **`@strapi-community/plugin-api-permissions`** plugin instead (which needs the generated `user` content type to exist). Capture permissions in those terms when Better Auth is chosen.
- **Follow the official Strapi Better Auth tutorial** (linked above) for the full install/config: it covers all three plugins (`plugin-better-auth`, `plugin-api-permissions`, `plugin-better-auth-dashboard`), removing users-permissions, the zod-4 peer-dep pin, seeding Public-role permissions, and wiring the Next.js client + forms. The concrete steps are inline below.

## What's in the stack

| Plugin | Role |
|---|---|
| `@strapi-community/plugin-better-auth` | Database adapter + route mounter. Owns sign-up, sign-in, sessions. Exposes `/api/auth/*`. |
| `@strapi-community/plugin-api-permissions` | Content API RBAC. Seeds **Public** and **Authenticated** roles and provides a per-content-type permission UI at **Settings → API Permissions**. |
| `@strapi-community/plugin-better-auth-dashboard` | Admin tab in Strapi admin: user list, sessions, growth charts, ban / revoke. |

## Why Better Auth (vs. stock Users & Permissions)

- Modern session model (cookie sessions, refresh, revocation)
- First-class social providers (Google, GitHub, Apple, Discord, etc.) without writing custom callbacks
- Built-in 2FA, magic links, passkeys, organizations — opt-in
- Type-safe React/Vanilla client (`better-auth/react`, `better-auth/client`)
- Cleaner DX than stock U&P for app-style products

Stock Users & Permissions is still fine for: simple email/password with no social, admin-only content sites, or when the user is migrating an existing v4 project.

## Install (steps verified against the official Strapi tutorial)

> Authoritative source: **Strapi's own tutorial** — https://strapi.io/blog/strapi-better-auth-tutorial-setup-guide-for-strapi-v5-and-next-js-16. The steps below follow it.

**1. Install** (in the Strapi project — `apps/cms` or wherever Strapi lives). Note the extra packages and the **zod 4 pin** (the dashboard needs zod 4; Strapi pulls zod 3 transitively):

```bash
npm install better-auth \
  @strapi-community/plugin-better-auth \
  @strapi-community/plugin-api-permissions \
  @strapi-community/plugin-better-auth-dashboard \
  @better-auth/infra \
  zod@^4.1.12
```

**2. Remove Users & Permissions — from `package.json`, not just disabled.** The plugin checks for the package at boot and throws if present, so disabling it in `config/plugins.ts` is **not** enough:

```bash
npm uninstall @strapi/plugin-users-permissions
```

**3. Enable the plugins** in `config/plugins.ts`:

```ts
export default () => ({
  'better-auth': { enabled: true },
  'better-auth-dashboard': { enabled: true },
  'api-permissions': { enabled: true },
})
```

**4. Configure** the Better Auth **instance** at `src/lib/auth.ts` (the runtime auto-discovers `./auth.ts`, `./lib/auth.ts`, or `./src/lib/auth.ts`). Export the instance, **not** a `() => betterAuth(...)` factory. `generateId: 'serial'` is **required** — omit it and foreign keys break on first sign-up:

```ts
// src/lib/auth.ts
import { betterAuth } from 'better-auth'
import { strapiAdapter } from '@strapi-community/plugin-better-auth'

export const auth = betterAuth({          // export the INSTANCE
  database: strapiAdapter(),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.STRAPI_URL ?? 'http://localhost:1337',
  trustedOrigins: [process.env.CLIENT_URL ?? 'http://localhost:3000'],
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  advanced: {
    database: { generateId: 'serial' }, // required
  },
})

export default auth
```

**5. Generate the Better Auth content types** (`user`, `session`, `account`, `verification` — without them auth fails and `plugin-api-permissions` warns the user type is missing):

```bash
npx @better-auth/cli generate --config src/lib/auth.ts --yes
# The official Strapi tutorial uses @better-auth/cli. The bare `auth` package is the
# same CLI under a shorter name — either works. Re-run after adding any Better Auth plugin.
```

> ⚠️ **Verified empirically on Strapi 5.47 + plugin-better-auth 1.0.0-beta.6 + plugin-api-permissions 1.0.0-alpha.3 (2026-06-02).** Findings that contradict or extend the plugin's own README:
> - The README says config goes in `config/better-auth.ts` — that path is **only** the `--config` arg for the generate CLI. The **runtime** loads from `src/lib/auth.ts` (or `./auth.ts` / `./lib/auth.ts`). Wrong location → boot error *"No Better Auth configuration was found."*
> - The README shows a **factory** (`const auth = () => betterAuth(...)`). The runtime rejected that with `TypeError: Cannot use 'in' operator to search for 'basePath' in undefined`. Exporting the **instance** (`export const auth = betterAuth(...)`) got past it.
> - `plugin-api-permissions` is **alpha** (less mature than the beta auth plugin).
> - Even following the docs, this beta stack is fiddly to boot (export-shape sensitivity; an early-DB-open `SqliteError` on the instance export). Budget real debugging time, prefer Postgres over SQLite, and follow the official Strapi tutorial closely. **This is exactly why it's not for production.**
> - **The official Strapi tutorial corroborates the key points** (https://strapi.io/blog/strapi-better-auth-tutorial-setup-guide-for-strapi-v5-and-next-js-16): remove U&P from `package.json` (disabling isn't enough), instance export at `src/lib/auth.ts`, `generateId: 'serial'` required, enable the three plugins in `config/plugins.ts`, and pin `zod@^4.1.12`.
> - The exact surface keeps moving — re-check the Strapi tutorial and https://strapi-community.github.io/plugin-better-auth/. The non-negotiables: Strapi ≥ 5.45, `generateId: 'serial'`, U&P removed (below), and the generate step.

Set env vars (locally and in Strapi Cloud):

- `BETTER_AUTH_SECRET` — `openssl rand -hex 32`
- `BETTER_AUTH_URL` — public URL of the Strapi backend (e.g., `https://my-app.strapiapp.com`). Must match exactly what providers have as the redirect origin.
- Provider-specific: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, etc.

## Provider redirect URIs

For each social provider, register the redirect URI in the provider's console:

```
<BETTER_AUTH_URL>/api/auth/callback/<provider>
```

e.g., `https://my-app.strapiapp.com/api/auth/callback/google`. A common deploy bug is registering the local dev URL but not the Strapi Cloud URL.

## Frontend wiring — just the gotchas

The standard client setup (`createAuthClient`, `useSession`, `signIn.email`/`signIn.social`/`signOut`) is boilerplate the build session can write from the Better Auth docs — don't spec it out. Capture only the three things that are easy to get wrong:

1. **Client package** matches the framework: `better-auth/react` (Next.js, TanStack Start, React) or `better-auth/vue` (Vue/Nuxt). See `frontend-frameworks.md`.
2. **`baseURL` must include the `/api/auth` suffix** — it's the Strapi origin + `/api/auth`, read from the framework's *public* env var (`NEXT_PUBLIC_`/`VITE_`/`PUBLIC_`/`NUXT_PUBLIC_`). A bare origin is the most common "client can't reach auth" bug.
3. **SSR session**: forward the incoming request cookies on the server-side fetch (Server Components / loaders / Nuxt server routes). Look up the current per-framework SSR helper in the Better Auth docs — it moves.

## Mapping Better Auth users to Strapi content

Better Auth manages its own `user` and `session` tables. To attach Strapi-side data (profile, preferences, owned content):

- Create a Strapi collection type `Profile` with a one-to-one relation to the Better Auth `user.id`.
- Use a Strapi lifecycle on `Profile.beforeCreate` to validate the linked user exists.
- Or: extend the Better Auth user schema directly via the plugin's user fields config (check README — supported fields vary by plugin version).

## Permissions (Better Auth path — NOT the stock U&P role model)

Because the Better Auth path **removes Users & Permissions**, the usual "Public / Authenticated role per content type" model does not apply here. Instead:

- **Content-API permissions are governed by `@strapi-community/plugin-api-permissions`.** Configure which roles can read/write each content type there. (Seed Public-role read permissions on bootstrap — the tutorial shows the snippet.)
- A request is "authenticated" when it carries a valid Better Auth session cookie. Gate `create`/`update`/`delete` of user-owned content on an authenticated session.
- For per-record ownership ("only the author can edit their article"), use the plugin's owner middleware, or write a Strapi **policy** (`src/policies/is-owner.ts`) and attach it to the route.
- The Strapi **admin** panel login is separate from end-user auth — Better Auth doesn't touch it.

> ⚠️ Verify the exact session→permission wiring against the plugin docs during the build — this is the part most likely to differ by plugin version. If it doesn't behave as described, flag it in the spec rather than guessing.

## Common gotchas

- **Cookies not set on the frontend** — `BETTER_AUTH_URL` and the frontend host must share a parent domain in production, OR use cross-site cookie config. Watch this when frontend (Vercel) and backend (Strapi Cloud) have different domains.
- **CORS** — add the frontend origin to Strapi's CORS middleware AND to Better Auth's `trustedOrigins` config.
- **Session not visible in SSR loader** — make sure the loader is forwarding cookies on its server-side fetch.
- **Migrations** — Better Auth needs its own tables. The plugin should handle migrations on first boot; verify by checking the DB after first `npm run develop`.

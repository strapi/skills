---
name: strapi-strict-types
description: Turn on and work with Strapi's strict types (beta), the `strictTypes` option in config/typescript.ts that checks server lookups, documents, routes and permission IDs against registered contracts. Use when a Strapi 5 TypeScript app enables strictTypes, when a type error mentions Strapi.Registries, ServiceContract, Core.ServiceFactory, Core.ControllerFactory, Core.RouteConfigFor, PermissionActionsOf or licensedFeatures, when a plugin service lookup resolves to `unknown`, or when TS2339 says a property "does not exist on type 'never'" on a licensed service. Do not use for apps without strictTypes or for front-end typing.
---

# Strapi strict types

> ⚠️ **Beta feature, in-progress skill.** Strict types are off by default and do not change runtime behavior: they only change how TypeScript checks the code. A minor release can tighten the contracts, so code that compiles today can report new errors after an upgrade.

Strict types are opt-in: `strictTypes: true` in `config/typescript.ts`. Type generation then registers the app's services, controllers, policies and middlewares, and TypeScript checks server lookups, Document Service results and inputs, typed route configs and permission action IDs against these contracts and those of the bundled Strapi packages. Not to be confused with the `strict` option of `tsconfig.json`.

Details (error catalogue, generated files, licensed feature names, limits, experimental-build install): [reference.md](reference.md).

## Hard rules

1. **Check `config/typescript.*` and the Strapi version first.** If the installed `@strapi/strapi` does not ship `strictTypes` (5.xx.x or later, or an experimental build, see reference.md), stop and say so.
2. **Never silence a strict error** with `as any`, `// @ts-ignore` or `// @ts-expect-error`. Use a type argument, a contract export, or `satisfies`.
3. **Never exclude `types/generated` from `tsconfig.json`**, never edit the generated files, never hand-import `@strapi/strapi/strict-types` or augment `Strapi.Registries.Settings`. Excluding the folder turns strict types off silently.
4. **Regenerate types after any change** to content-types, services, controllers, policies or middlewares.
5. **Plugin and library code must compile with strict types on AND off.**
6. **Validate request input yourself.** `ctx.request.body`, `ctx.params` and `ctx.state.user` stay `any`: request data passes strict contracts unchecked.

## Step 1 — Detect

1. Read `@strapi/strapi` in `package.json` (all `@strapi/*` must share one version). TypeScript app only: a JS app gets no `config/typescript.ts` and strict types stay off.
2. Read `config/typescript.ts`. New TS projects have it with `strictTypes: false`; projects created earlier have no file.
3. License: `STRAPI_LICENSE` env var or a `license.txt`. Ask the user which features it includes; types cannot read it.
4. Package manager: lockfile (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`). Use it for every command below.
5. Check `tsconfig.json` does not exclude `types/generated/**`.

## Step 2 — Enable

1. Create or edit `config/typescript.ts`:

   ```ts
   import type { Core } from '@strapi/strapi';

   const config: Core.Config.TypeScript = {
     strictTypes: true,
   };

   export default config;
   ```

2. With a license, add `licensedFeatures` with that license's features, e.g. `licensedFeatures: ['review-workflows', 'cms-content-releases']` (accepted names in reference.md).
3. Generate and check:

   ```bash
   npm run strapi ts:generate-types   # yarn strapi ts:generate-types
   npx tsc --noEmit                   # yarn tsc --noEmit
   ```

   `types/generated/` must now hold 6 more files, and the output must have no `typescript.strictTypes is on, but tsconfig.json leaves out types/generated/…` warning.

Turn off: `strictTypes: false` (or remove the key), regenerate. The 6 strict files are removed.

## Step 3 — Triage by error family

Fix in this order: config and generated files → application contracts → document types. Full catalogue in reference.md.

| Error | Family | Fix |
| --- | --- | --- |
| `ValidationError: Invalid config.typescript.strictTypes value` | config | boolean only |
| No error at all + `leaves out types/generated` warning | config | remove `types/generated/**` from `exclude` |
| `TS2571` / `TS18046` / `TS2339` on a lookup | lookup | app service: fix name, regenerate. Plugin: type argument (Step 4b) |
| `TS18046: 'strapi.config.server' is of type 'unknown'` | lookup | `strapi.config.get('server.url')` |
| `TS2344` on `satisfies Core.ServiceFactory` / `ControllerFactory` | contract | export `ServiceContract` / `ControllerContract` (Step 4a) |
| `TS2339 … does not exist on type 'never'` on a licensed service | license | add the feature to `licensedFeatures`, or remove the code |
| `TS2820` on a permission action or feature name | name | fix typo, or declare the actions (Step 4d) |
| `TS18047 … possibly 'null'` on a document field | documents | handle `null` (e.g. `?? ''`) |
| `TS2322 'string' is not assignable to 'Date'` | documents | dates are strings: `new Date(value)` |

## Step 4 — Patterns

Snippets below come from the strict types docs pages and compile on the verified build.

**a. Application contracts.** Export `ServiceContract` / `ControllerContract`, check the factory with `satisfies`:

```ts
// src/api/article/services/article.ts
import { factories, type Core } from '@strapi/strapi';

export type ServiceContract = Core.CoreAPI.Service.ContentType<'api::article.article'> & {
  findPublishedTitles(): Promise<string[]>;
};

export default factories.createCoreService('api::article.article', ({ strapi }) => ({
  async findPublishedTitles() {
    const articles = await strapi
      .documents('api::article.article')
      .findMany({ status: 'published', fields: ['title'] });

    return articles
      .map((article) => article.title)
      .filter((title): title is string => title !== null);
  },
})) satisfies Core.ServiceFactory<'api::article.article'>;
```

Same shape for controllers: `Core.CoreAPI.Controller.ContentType<uid> & { titles: Core.ControllerHandler<string[]> }` + `satisfies Core.ControllerFactory<uid>`. A contract shared between modules lives outside `services/` and `controllers/` (Strapi loads every file there).

**b. Plugins without contracts** (local plugins, most third-party plugins, Users & Permissions services): pass the expected type. Compiles with strict on and off.

```ts
type JwtService = {
  issue(payload: object): string;
};

const token = strapi.plugin('users-permissions').service<JwtService>('jwt').issue({ id: 1 });
```

**c. Policies, middlewares, routes.** Type config with `Core.PolicyHandler<Config>` / `Core.MiddlewareFactory<Config>`; check route config with `satisfies Core.RouteConfigFor` (opt-in per route file):

```ts
// src/policies/has-role.ts
import type { Core } from '@strapi/strapi';

export default ((policyContext, config) => {
  return config.roles.includes(policyContext.request.get('x-role'));
}) satisfies Core.PolicyHandler<{ roles: string[] }>;
```

```ts
// src/api/article/routes/custom-article.ts
import type { Core } from '@strapi/strapi';

const editorOnly = {
  policies: [{ name: 'global::has-role', config: { roles: ['editor'] } }],
} satisfies Core.RouteConfigFor;
```

Read headers with `policyContext.request.get(...)`; `policyContext.get` compiles but is `undefined` at runtime.

**d. Permission actions.** Declare from the `as const` list passed to `registerMany()` (without `as const`, `registerMany()` does not compile). The declared ID is `api::<uid>`:

```ts
// src/index.ts
import type { Core } from '@strapi/strapi';

const actions = [
  { section: 'settings', category: 'reports', displayName: 'Export reports', uid: 'report.export' },
] as const;

declare global {
  namespace Strapi.Registries {
    interface PermissionActions extends Core.PermissionActionsOf<typeof actions> {}
  }
}
// bootstrap(): await strapi.service('admin::permission').actionProvider.registerMany(actions);
```

**e. Licensed features.** `licensedFeatures` lists the features of the license the app runs with. Unlisted features' contracts are `undefined`. Never add a feature the license does not include just to silence an error.

**f. Lifecycles.** `export default { afterCreate(event) { … } } satisfies Core.Lifecycles<'api::article.article'>;`. `event.params.data` / `where` stay `unknown`: narrow at runtime.

**g. Dual mode (plugins, shared code).**
- Annotate callback parameters (strict off: implicit `any`, `TS7006` / `TS7031`).
- Reference a policy by name alone, or `{ name, config: {} }` (strict off: object form requires `config`).
- Populated to-many relations can be `null` with strict off (`TS18049`): `(article.tags ?? []).length`.

**h. Front end.** Share only `types/generated/contentTypes.d.ts` and `components.d.ts`; the other generated files import server code.

## Step 5 — Verify

1. `ts:generate-types`: 6 strict files present, no `types/generated` warning.
2. `tsc --noEmit`: 0 errors.
3. `build` (`npm run build` / `yarn build`): passes (a strict error stops it, `noEmitOnError`).
4. Sanity check: call a method on a misspelled lookup (`strapi.service('api::article.articel').find()`), `tsc` must fail on that line; revert.
5. Plugin or shared code: also compile with `strictTypes: false` (regenerate first).

## Docs

The pages below are drafted in [strapi/documentation#3726](https://github.com/strapi/documentation/pull/3726) and go live on docs.strapi.io with the Strapi release that ships strict types ([strapi/strapi#28147](https://github.com/strapi/strapi/pull/28147)). They are the source of truth: when live, prefer them (via the `strapi-docs-mcp` skill when installed) over this skill.

- Strict types: https://docs.strapi.io/cms/typescript/strict-types
- Turning on strict types in an existing project: https://docs.strapi.io/cms/typescript/enabling-strict-types
- TypeScript configuration (`strictTypes`, `licensedFeatures`): https://docs.strapi.io/cms/configurations/typescript
- Plugin contracts (contributors): [Strapi TypeScript contributor guide](https://github.com/strapi/strapi/blob/feat/strict-types-exploration/docs/docs/contributing/05-typescript.md#declaring-a-packages-contracts)
- Feedback: [strict types GitHub discussion](https://github.com/strapi/strapi/discussions/27747)

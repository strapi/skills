# Strict types — reference

Last verified against: `@strapi/strapi@0.0.0-experimental.6d1aabc3abcd248506b8fc7701581af15da28a56` (strict on, `tsc --noEmit` exit 0). The later build `0.0.0-experimental.8d7fb16675cec16b2c552ee2ce4a8c0245cf49e2` only changes the `strictTypes` JSDoc.

Source of truth: the strict types docs pages (see SKILL.md → Docs). Update this file in the same pass as them.

## Error catalogue

| Code / message | Cause | Fix |
| --- | --- | --- |
| `ValidationError: Invalid config.typescript.strictTypes value: "yes". Expected boolean (true or false).` | `strictTypes` is not a boolean (fails type generation and `strapi develop`) | `true` or `false` |
| No strict error + `[WARN] (Typegen) typescript.strictTypes is on, but tsconfig.json leaves out types/generated/…` | `tsconfig.json` excludes `types/generated/**`; the program type-checks without strict types | remove it from `exclude` |
| `TS2571: Object is of type 'unknown'`, `TS18046`, `TS2339` on an app lookup | misspelled UID, or types not regenerated after creating the module | fix the name, run `ts:generate-types` |
| Same codes on a plugin lookup | plugin publishes no contracts: local plugins (`src/plugins/*`), most third-party plugins, Users & Permissions services | type argument: `strapi.plugin(name).service<T>(service)` |
| `TS18046: 'strapi.config.server' is of type 'unknown'` | direct config reads are `unknown` | `strapi.config.get('server.url')` |
| `TS2344` on `satisfies Core.ServiceFactory<uid>` / `Core.ControllerFactory<uid>` | no `ServiceContract` / `ControllerContract` export: type generation registered the factory's return type | export the contract type from the module |
| `TS2339: Property '…' does not exist on type 'never'` on a licensed service | feature missing from `licensedFeatures`: contract typed `undefined`, `?.` / `if` narrows to `never` | add the feature if the license has it, or remove the code |
| `TS2820` on a permission action ID or licensed feature | typo or undeclared action | fix the name (TS suggests one), or declare actions with `Core.PermissionActionsOf` |
| `registerMany()` does not compile | actions list not `as const` | add `as const` |
| `TS18047: '…' is possibly 'null'` on a document field | scalar attributes can be `null`, even when required | handle `null` (`?? ''`, type guard) |
| `TS2322: Type 'string' is not assignable to type 'Date'` | date/time attributes are strings | `new Date(value)` |
| `TS2322` on `populate` / `fields` declared `as const` | read-only arrays rejected (strict on and off) | pass a mutable copy: `populate: [...populate]` |
| `TS2322` on a policy referenced by name only | all fields of its config are optional | `{ name: 'global::x', config: {} }` |
| `TS7006` / `TS7031` with strict off (plugin/shared code) | callback params are implicit `any` without strict contracts | annotate the parameters |
| `TS18049` with strict off (plugin/shared code) | populated to-many relations can be `null`/`undefined` | `(article.tags ?? []).length` |
| `strapi build` exit 1 on any of the above | `noEmitOnError` in the project `tsconfig.json` | fix the type error; `strapi develop` reports and waits |

## Generated files (strict on only)

Written by `ts:generate-types` and `strapi develop` in `types/generated/`, next to `contentTypes.d.ts` and `components.d.ts`. Removed when strict types are turned off (output byte-equal to a never-strict project). Never edit them.

| File | Purpose |
| --- | --- |
| `strict.d.ts` | Turns strict types on for the program, declares the licensed features |
| `plugins.d.ts` | Loads the type declarations of installed plugins |
| `services.ts` | Registers app services |
| `controllers.ts` | Registers app controllers |
| `policies.ts` | Registers app policies and their config |
| `middlewares.ts` | Registers app middlewares and their config |

Front ends may share `contentTypes.d.ts` and `components.d.ts` only. On a non-English machine locale, the first generation with strict on reorders keys once (types unchanged).

## Licensed feature names

`licensedFeatures` accepts: `'review-workflows'`, `'cms-content-releases'`, `'cms-content-history'`, `'cms-advanced-preview'`, `'cms-ai'`, `'cms-byok-ai'`, `'sso'`, `'audit-logs'`, `'licensed'` (alone, for a license with no feature).

- Only read when `strictTypes: true`. Default `[]`.
- Unlisted features: contracts typed `undefined`.
- Type generation follows the list, not the boot license, and logs a warning when they disagree. Types cannot verify the license.

## Known limits (beta, to revisit)

- Request input: `ctx.request.body`, `ctx.params`, `ctx.state.user` stay `any`. Validate and sanitize yourself.
- `findMany(ctx.query)` gives an open result (`id`, `documentId` present, the rest optional).
- Users & Permissions services: `unknown` until [strapi/strapi#27928](https://github.com/strapi/strapi/pull/27928).
- Lifecycle hooks: `event.params.data` / `where` values are `unknown`.
- `strapi.db.query()` results stay `any`.
- Read-only `fields` / `populate` arrays rejected (strict on and off).
- JS apps: strict types stay off (no `config/typescript.ts`).
- `skipLibCheck: false` shows errors in published declarations of `@strapi/content-type-builder` and `@strapi/content-manager`. Keep the template's `skipLibCheck: true`.

## Experimental-build install (before the release)

Until strict types ship in a 5.xx.x release, they only exist in experimental builds of [strapi/strapi#28147](https://github.com/strapi/strapi/pull/28147). Not for production.

- Pin the exact version (`0.0.0-experimental.<sha>`), never the moving `experimental` tag. Use the same version for every `@strapi/*` package.
- Check it exists: `npm view @strapi/strapi@<version> version --prefer-online` (npm can serve a stale list right after a push).
- New app: `npx create-strapi-app@<version> my-project --non-interactive --skip-cloud --no-run`, then set `strictTypes: true`.
- Existing app, npm: set every `@strapi/*` dependency to `<version>`, then `rm -rf node_modules package-lock.json && npm install`, or `npm install --legacy-peer-deps`. A plain `npm install` fails with `ERESOLVE` (prereleases declare exact peer versions). Third-party plugins with a `^5` peer range also need `--legacy-peer-deps`.
- yarn / pnpm: untested. Under pnpm, regenerate the lockfile; importing `@strapi/email` or `@strapi/upload` types needs an explicit dependency (`TS2307`).
- `npx @strapi/upgrade` refuses prerelease targets ("must be greater than the current version"): edit versions by hand for this case only.

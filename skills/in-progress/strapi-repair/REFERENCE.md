# Strapi repair reference

## Table of contents

- [Security hardening (PR #26737)](#security-hardening-pr-26737)
- [pnpm & monorepo](#pnpm--monorepo)
- [Deployment & URLs](#deployment--urls)
- [Environment & database](#environment--database)
- [API issues (usually config, not bugs)](#api-issues-usually-config-not-bugs)
- [Clean reinstall ladder](#clean-reinstall-ladder)
- [Likely product bugs (stop and link)](#likely-product-bugs-stop-and-link)

## Security hardening (PR #26737)

**Source:** [PR #26737 — security defaults for create-strapi-app](https://github.com/strapi/strapi/pull/26737) (contributor doc: `docs/docs/docs/01-core/configuration/01-security-defaults.md` in that PR).

Complete the checklist in [SKILL.md — Security audit](../strapi-repair/SKILL.md#security-audit-checklist) by reading project files. Apply values from the PR / future docs — do not duplicate full config blocks in the skill.

| Area | Config file | What to check |
| --- | --- | --- |
| Strict API params | `config/api.*` | `rest.strictParams`, `documents.strictParams` |
| Refresh auth | `config/plugins.*` | `users-permissions`: `jwtManagement: 'refresh'`, `sessions.httpOnly` |
| Upload MIME | `config/plugins.*` | `upload.config.security.allowedTypes` / `deniedTypes` |
| Webhooks | `config/server.*` | `webhooks.populateRelations: false` |
| Secrets | `.env` | `JWT_SECRET` present |

**Also for production** (PR doc): [CORS](https://docs.strapi.io/cms/configurations/middlewares#cors), database SSL, `server.proxy` behind reverse proxy, HTTPS for [data transfer](https://docs.strapi.io/cms/data-management/transfer).

**Client docs for auth changes:** [JWT management modes](https://docs.strapi.io/cms/features/users-permissions#jwt-management-modes).

## pnpm & monorepo

| Topic | Link |
| --- | --- |
| pnpm v11 config migration | [pnpm.io/migration](https://pnpm.io/migration) — `pnpm-workspace.yaml` required |
| `catalog:` build failures | [strapi/strapi#22849](https://github.com/strapi/strapi/issues/22849) — set `USE_EXPERIMENTAL_DEPENDENCIES=true` |
| Hoisting for admin Vite | [strapi/strapi#15992](https://github.com/strapi/strapi/issues/15992), [discussion #25404](https://github.com/strapi/strapi/discussions/25404) |
| Strapi build checks peer deps | [Build command (contributor)](https://docs.strapi.io/cms/cli#strapi-build) |

**pnpm 11 checklist:**

1. Root `pnpm-workspace.yaml` with `packages`, and any `catalogs` / `overrides` / hoist settings (moved out of `package.json#pnpm`).
2. `.npmrc` in v11: only auth/registry — other settings belong in `pnpm-workspace.yaml`.
3. Strapi app keeps `react`, `react-dom`, `styled-components`, `react-router-dom` in its own `package.json`.
4. Monorepo + catalogs: `USE_EXPERIMENTAL_DEPENDENCIES=true` when running `strapi build` / `strapi develop`.
5. Reinstall after config changes: remove `node_modules` + lockfile → `pnpm install`.

## Deployment & URLs

| Symptom | Reference |
| --- | --- |
| Admin calls `localhost:1337` in browser | [strapi/strapi#12129](https://github.com/strapi/strapi/issues/12129) — `server.url`, `admin.url`, proxy |
| Subpath / reverse proxy deploy | [Server configuration](https://docs.strapi.io/cms/configurations/server), [middlewares](https://docs.strapi.io/cms/configurations/middlewares) |
| Admin not loading on public internet | Rebuild admin, URL config, CORS, HTTPS |

## Environment & database

| Symptom | Likely cause | Reference |
| --- | --- | --- |
| `Unknown dialect undefined` | `DATABASE_CLIENT` missing in `.env` | [Database configuration](https://docs.strapi.io/cms/configurations/database) |
| Knex pool timeout | DB down or pool exhausted | [strapi/strapi#11860](https://github.com/strapi/strapi/issues/11860) |
| Wrong config after TS build | `dist/` shadowing source | [Testing guide — dist pitfall](https://docs.strapi.io/cms/testing#set-up-a-testing-environment) |
| sqlite3 errors after Node upgrade | Native module mismatch | Reinstall `sqlite3` / `better-sqlite3` |
| Missing secrets | Incomplete `.env` | [Environment variables](https://docs.strapi.io/cms/configurations/environment) — `APP_KEYS`, `JWT_SECRET`, etc. |

## API issues (usually config, not bugs)

Explain before "fixing" code — these are frequently **working as intended**.

| User report | What's going on | Reference |
| --- | --- | --- |
| 403 on `/api/*` | Role permissions not enabled | [Users & Permissions](https://docs.strapi.io/cms/features/users-permissions) — Public / Authenticated roles |
| 403 after `strictParams` | Unknown query keys rejected | [Custom Content API parameters](https://docs.strapi.io/cms/backend-customization/routes#custom-content-api-parameters) |
| Populate empty / wrong | Draft vs published, relation direction, syntax | [REST populate](https://docs.strapi.io/cms/api/rest/populate-select), [strapi/strapi#21355](https://github.com/strapi/strapi/issues/21355) |
| Can't populate UP users | Plugin limitation | [strapi/strapi#11957](https://github.com/strapi/strapi/issues/11957) |
| Schema change didn't drop DB columns | No auto-drop by design | [strapi/strapi#1114](https://github.com/strapi/strapi/issues/1114) |
| Webhooks missing relations | `populateRelations: false` (security default) | PR #26737 |
| Using `id` instead of `documentId` | Strapi 5 Document Service | [REST API docs](https://docs.strapi.io/cms/api/rest) |

For 403 in **tests**, use [strapi-rest-api-testing](../strapi-rest-api-testing/SKILL.md) permission helpers.

## Clean reinstall ladder

Only after softer fixes fail. **Confirm** before deleting databases.

1. Stop Strapi.
2. Delete `.cache`, `.strapi/client` (admin build cache).
3. `strapi build`
4. Delete `node_modules` + lockfile → reinstall with the same package manager.
5. Rebuild native modules if using SQLite (`sqlite3` / `better-sqlite3`).
6. `strapi develop` or `strapi start`.

Do not delete `.tmp/*.db` if it is the **development** database unless the user confirms.

## Likely product bugs (stop and link)

After rebuild + cache clear, if still broken, check open issues before more local hacks:

| Symptom | Issue |
| --- | --- |
| Admin "Failed to fetch dynamically imported module" | [strapi/strapi#20870](https://github.com/strapi/strapi/issues/20870) |
| pnpm catalog semver errors | [strapi/strapi#22849](https://github.com/strapi/strapi/issues/22849) (workaround documented above) |

Suggest upgrading Strapi patch version or commenting on the issue with reproduction steps.

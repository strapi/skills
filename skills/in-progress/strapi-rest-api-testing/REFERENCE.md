# REST API testing reference

## Table of contents

- [Test database options](#test-database-options)
- [Database safety checklist](#database-safety-checklist)
- [dist directory pitfall](#dist-directory-pitfall)
- [Content API permissions](#content-api-permissions)
- [Authentication](#authentication)
- [Windows and SQLite](#windows-and-sqlite)
- [Troubleshooting](#troubleshooting)
- [CI (GitHub Actions)](#ci-github-actions)
- [Vitest escape hatch](#vitest-escape-hatch)

## Test database options

**Default (recommended):** SQLite file isolated from dev data.

Copy [templates/config/env/test/database.js](../templates/config/env/test/database.js). Uses `.tmp/test.db` when `NODE_ENV=test`.

| Option | When to use | Config |
| --- | --- | --- |
| **SQLite file** (default) | Almost all projects; fast; no external services | `DATABASE_CLIENT=sqlite`, `DATABASE_FILENAME=.tmp/test.db` |
| **SQLite in-memory** | Fastest; no file cleanup; can be flaky on Windows with file locks | `DATABASE_FILENAME=:memory:` in harness env |
| **Dedicated Postgres** | Tests need Postgres-specific SQL/types | Separate DB named `*_test*`; never share dev DB name/host |
| **Dedicated MySQL** | Same as Postgres | Separate `strapi_test` database |

Harness env vars (set in `tests/strapi.js`) override connection details during tests. The test script must run with `NODE_ENV=test` so Strapi loads `config/env/test/database.js`.

**Postgres example** (`config/env/test/database.js`):

```js
module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('DATABASE_HOST', '127.0.0.1'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'strapi_test'),
      user: env('DATABASE_USERNAME', 'strapi'),
      password: env('DATABASE_PASSWORD', 'strapi'),
    },
  },
});
```

Require `DATABASE_NAME` (or host) to contain `test` — [verify-test-env.js](../scripts/verify-test-env.js) enforces this for non-SQLite clients.

## Database safety checklist

Before every first `setupStrapi()` in a session:

1. `NODE_ENV` is `test` (via npm/yarn script, not assumed).
2. `config/env/test/database.js` exists and does not point at production credentials.
3. Dev `.env` is **not** relied on for DB host/name during tests — harness sets test secrets and SQLite defaults.
4. `.tmp/` is in `.gitignore`.
5. Run `node tests/verify-test-env.js` (copy from [scripts/verify-test-env.js](../scripts/verify-test-env.js)).

**Abort** if:

- `NODE_ENV` is `development` or `production`
- Postgres/MySQL database name lacks `test` (case-insensitive) and user did not confirm a dedicated test instance
- `DATABASE_URL` points at a known production hostname pattern (configure blocklist in verify script)

## dist directory pitfall

If `yarn develop` compiled config into `dist/config/` and tests force `distDir: './dist'`, Jest may load the **dev** database config instead of `config/env/test/`.

**Recommendations (from [official docs](https://docs.strapi.io/cms/testing#set-up-a-testing-environment)):**

- Do **not** pass custom `distDir` in the test harness; use `createStrapi().load()`.
- Avoid running `yarn develop` immediately before `yarn test`.
- If tests fail with wrong DB after a dev build, remove `dist/` or rebuild specifically for tests.

## Content API permissions

`403 Forbidden` on `/api/*` usually means the role lacks permission — not a routing bug.

Use [templates/tests/helpers/permissions.js](../templates/tests/helpers/permissions.js):

```js
const { grantPublicPermissions } = require('../helpers/permissions');

beforeAll(async () => {
  await setupStrapi();
  await grantPublicPermissions(strapi, ['api::article.article.find']);
});
```

Permission action IDs follow `api::<singular>.<singular>.<action>` (e.g. `find`, `findOne`, `create`).

## Authentication

For `users-permissions` JWT flows, use [templates/tests/helpers/auth.js](../templates/tests/helpers/auth.js).

The [official harness](https://docs.strapi.io/cms/testing#create-the-strapi-test-harness) patches `user.add` to assign the authenticated role automatically — include that patch when copying the full TS harness from docs.

## Windows and SQLite

[Official docs](https://docs.strapi.io/cms/testing) warn that SQLite **file** tests can fail on Windows due to file locking. Prefer `:memory:` for Windows CI, or use Postgres in Docker for local Windows dev.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Timeout on first boot | Strapi cold start | `jest.setTimeout(30000)` in harness; increase if needed |
| `Config file not loaded ... database.ts` | TS config without harness patches | Use full harness from [official guide](https://docs.strapi.io/cms/testing#create-the-strapi-test-harness) |
| Wrong database / dev data in tests | `dist/` or missing `NODE_ENV=test` | See [dist directory pitfall](#dist-directory-pitfall) |
| 403 on Content API | Missing permissions | [Content API permissions](#content-api-permissions) |
| Jest hangs after tests | Open handles | `--forceExit --detectOpenHandles` in test script |
| `Unsupported database client` | Driver not installed | `sqlite3` for SQLite; `pg` / `mysql2` for others |

## CI (GitHub Actions)

Official workflow: [Automate tests with GitHub Actions](https://docs.strapi.io/cms/testing#automate-tests-with-github-actions).

For Postgres in CI, start a service container and set `DATABASE_*` env vars to the `*_test` database only.

## Vitest escape hatch

If the project **already** uses Vitest for all tests:

- Port Jest config equivalents (`testEnvironment: 'node'`, timeouts).
- Keep the same `tests/strapi.js` harness and `NODE_ENV=test` requirement.
- Do not add Vitest alongside Jest on greenfield bootstrap.

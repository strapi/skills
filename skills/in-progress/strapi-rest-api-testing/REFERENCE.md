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

**Default:** copy `config/env/test/database.js` from [Set up a testing environment](https://docs.strapi.io/cms/testing#set-up-a-testing-environment). Isolated SQLite at `.tmp/test.db` when `NODE_ENV=test`.

| Option | When to use | Notes |
| --- | --- | --- |
| **SQLite file** (default) | Almost all projects | From official docs |
| **SQLite in-memory** | Fastest; Windows file-lock issues | Set `DATABASE_FILENAME=:memory:` in harness env |
| **Dedicated Postgres** | Postgres-specific SQL/types | DB name must contain `test` |
| **Dedicated MySQL** | Same as Postgres | e.g. `strapi_test` |

Harness env vars in `tests/strapi.js` (from docs) set secrets and can override `DATABASE_*`. The `test` npm script must set `NODE_ENV=test`.

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

[verify-test-env.js](scripts/verify-test-env.js) requires `test` in the database name for non-SQLite clients.

## Database safety checklist

Before every first `setupStrapi()` in a session:

1. `NODE_ENV` is `test` (via npm/yarn script).
2. `config/env/test/database.js` exists (from official docs) and does not use production credentials.
3. `.tmp/` is in `.gitignore`.
4. Run `NODE_ENV=test node tests/verify-test-env.js`.

**Abort** if `NODE_ENV` is not `test`, or Postgres/MySQL database name lacks `test` without explicit user confirmation.

## dist directory pitfall

From [official docs](https://docs.strapi.io/cms/testing#set-up-a-testing-environment):

- Do **not** pass custom `distDir` in the test harness.
- Avoid `yarn develop` immediately before `yarn test`.
- If wrong DB after a dev build, remove `dist/`.

## Content API permissions

`403 Forbidden` on `/api/*` → missing role permission.

Use [templates/tests/helpers/permissions.js](templates/tests/helpers/permissions.js):

```js
const { grantPublicPermissions } = require('../helpers/permissions');

beforeAll(async () => {
  await setupStrapi();
  await grantPublicPermissions(strapi, ['api::article.article.find']);
});
```

Action IDs: `api::<singular>.<singular>.<action>`.

## Authentication

Use [templates/tests/helpers/auth.js](templates/tests/helpers/auth.js). The [official harness](https://docs.strapi.io/cms/testing#create-the-strapi-test-harness) patches `user.add` for the authenticated role — keep that when copying from docs.

For auth API patterns, see [Test API authentication](https://docs.strapi.io/cms/testing#test-api-authentication).

## Windows and SQLite

[Official docs](https://docs.strapi.io/cms/testing) warn SQLite **file** tests can fail on Windows. Prefer `:memory:` or Postgres in Docker.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Timeout on first boot | Cold start | `jest.setTimeout(30000)` in harness (docs include this) |
| `Config file not loaded ... database.ts` | Harness not from docs | Copy full harness from [official guide](https://docs.strapi.io/cms/testing#create-the-strapi-test-harness) |
| Wrong database | `dist/` or missing `NODE_ENV=test` | [dist directory pitfall](#dist-directory-pitfall) |
| 403 on Content API | Missing permissions | [Content API permissions](#content-api-permissions) |
| Jest hangs | Open handles | `--forceExit --detectOpenHandles` in test script |
| `Unsupported database client` | Missing driver | `sqlite3`, `pg`, or `mysql2` |

## CI (GitHub Actions)

[Automate tests with GitHub Actions](https://docs.strapi.io/cms/testing#automate-tests-with-github-actions). For Postgres in CI, use a service container and a `*_test` database only.

## Vitest escape hatch

Only if the project **already** uses Vitest everywhere: port Jest settings, keep the same `tests/strapi.js` from docs and `NODE_ENV=test`. Do not add Vitest alongside Jest on greenfield bootstrap.

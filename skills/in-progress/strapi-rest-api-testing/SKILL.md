---
name: strapi-rest-api-testing
description: Bootstraps and writes REST API integration tests for Strapi 5 application projects using Jest, Supertest, and an isolated test database. Use when the user asks to test a REST endpoint, set up API tests, verify /api responses, or says "build me an API test for X endpoint".
---

# Strapi REST API integration testing

Write **in-process HTTP tests** (Supertest → `strapi.server.httpServer`). Not browser E2E. Not monorepo `yarn test:api`.

## Source of truth (official docs)

Copy harness and database setup **verbatim** from the [Strapi 5 Testing guide](https://docs.strapi.io/cms/testing). Do not maintain a forked harness in the user project.

| Docs section | What to copy |
| --- | --- |
| [Install tools](https://docs.strapi.io/cms/testing#install-tools) | Jest + Supertest deps, `test` script, Jest config in `package.json` |
| [Set up a testing environment](https://docs.strapi.io/cms/testing#set-up-a-testing-environment) | `config/env/test/database.js` |
| [Create the Strapi test harness](https://docs.strapi.io/cms/testing#create-the-strapi-test-harness) | `tests/ts-compiler-options.js`, `tests/ts-runtime.js`, `tests/strapi.js` |

This skill adds **only** what the docs do not cover well: bootstrap gates, test-env safety checks, a `/_health` smoke test, and auth/permission helpers.

## Hard rules

1. **Never use the dev or production database.** Tests run only with `NODE_ENV=test` and `config/env/test/database.js`. Run `tests/verify-test-env.js` before the first `setupStrapi()`.
2. **Do not write feature tests until the smoke test passes.** Bootstrap is incomplete until `tests/app.test.js` is green.
3. **Do not mark the task done until the requested test passes** (`yarn test` or `npm test`).
4. **Default stack:** Jest + Supertest + SQLite test DB. Do not introduce Vitest on first setup unless the project already uses Vitest everywhere.
5. **Do not pass `distDir` in the harness** — see [REFERENCE.md](REFERENCE.md#dist-directory-pitfall).

## Workflow

### Phase 0 — Inventory

Check:

- `package.json` — test runner, `test` script, existing Jest config
- `config/env/test/database.js` — test DB configured?
- `tests/strapi.js` — harness from official docs?
- `config/` file extensions (`.ts` needs the full three-file harness from docs)
- Content types under `src/api/` for the endpoint under test
- `@strapi/plugin-users-permissions` if auth is involved

If test infra is missing → Phase 1. If present but failing → fix harness first (Phase 2), then Phase 3.

### Phase 1 — Bootstrap (first time only)

**1. Dependencies** — per [Install tools](https://docs.strapi.io/cms/testing#install-tools):

```bash
yarn add -D jest supertest sqlite3
```

**2. `package.json`** — merge into the existing file (do not replace the whole file):

- Add or update `scripts.test` to run with `NODE_ENV=test`:

  ```json
  "test": "NODE_ENV=test jest --forceExit --detectOpenHandles"
  ```

- Add a `jest` block if missing (merge with any existing `jest` config):

  ```json
  "jest": {
    "testEnvironment": "node",
    "testPathIgnorePatterns": ["/node_modules/", ".tmp", ".cache"],
    "testMatch": ["**/tests/**/*.test.js"]
  }
  ```

  On Windows, use `cross-env NODE_ENV=test` if `NODE_ENV=test` fails in the shell.

**3. Test database** — copy `config/env/test/database.js` from [Set up a testing environment](https://docs.strapi.io/cms/testing#set-up-a-testing-environment). For Postgres/MySQL, adapt per [REFERENCE.md](REFERENCE.md#test-database-options).

**4. Test harness** — copy all harness files from [Create the Strapi test harness](https://docs.strapi.io/cms/testing#create-the-strapi-test-harness):

- `tests/ts-compiler-options.js`
- `tests/ts-runtime.js`
- `tests/strapi.js`

Use the same three files for **JS and TS** projects. The TS loader patches are harmless when config is JavaScript-only.

**5. Smoke test** — copy [templates/tests/app.test.js](templates/tests/app.test.js) (uses `GET /_health`, not the docs' `/api/hello` example — no custom route required).

**6. Safety check** — copy [scripts/verify-test-env.js](scripts/verify-test-env.js) to `tests/verify-test-env.js`.

**7. Helpers** — copy [templates/tests/helpers/](templates/tests/helpers/) when tests need auth or Content API permissions.

**8. `.gitignore`** — ensure `.tmp/` is ignored.

**9. Verify environment:**

```bash
NODE_ENV=test node tests/verify-test-env.js
```

### Phase 2 — Prove the harness (gate)

```bash
yarn test tests/app.test.js
```

- **Pass** → continue to Phase 3.
- **Fail** → fix bootstrap only. **Do not** add endpoint tests until this passes.

Common fixes: [REFERENCE.md](REFERENCE.md#troubleshooting)

### Phase 3 — Write the requested test

Place tests under `tests/integration/api/`.

```js
const request = require('supertest');
const { setupStrapi, cleanupStrapi } = require('../strapi');

beforeAll(async () => {
  await setupStrapi();
});

afterAll(async () => {
  await cleanupStrapi();
});

it('GET /api/articles returns published articles', async () => {
  const res = await request(strapi.server.httpServer)
    .get('/api/articles')
    .expect(200);
  expect(res.body.data).toEqual(expect.any(Array));
});
```

- Seed with `strapi.documents('api::type.type').create({ data, status: 'published' })` (Strapi 5).
- **403** → [templates/tests/helpers/permissions.js](templates/tests/helpers/permissions.js) — [REFERENCE.md](REFERENCE.md#content-api-permissions)
- **Auth** → [templates/tests/helpers/auth.js](templates/tests/helpers/auth.js)

See [examples/get-collection.test.js](examples/get-collection.test.js) and [Test a basic API endpoint](https://docs.strapi.io/cms/testing#test-a-basic-api-endpoint) for more patterns.

### Phase 4 — Verify and finish

```bash
yarn test path/to/new.test.js
```

Iterate until green. Report: files added, how to run tests, which test DB option is active.

## Skill-owned templates (copy into the user project)

These are **not** in the official docs — the only files to copy from this skill repo:

| File | Purpose |
| --- | --- |
| [templates/tests/app.test.js](templates/tests/app.test.js) | Smoke test (`GET /_health` → 204) |
| [templates/tests/helpers/auth.js](templates/tests/helpers/auth.js) | JWT login helper |
| [templates/tests/helpers/permissions.js](templates/tests/helpers/permissions.js) | Grant role permissions |
| [scripts/verify-test-env.js](scripts/verify-test-env.js) | Pre-flight DB / `NODE_ENV` safety |

Everything else (harness, test DB config, Jest setup) comes from [docs.strapi.io/cms/testing](https://docs.strapi.io/cms/testing).

## Advanced

- Test DB options, safety, CI, Windows SQLite: [REFERENCE.md](REFERENCE.md)
- Example endpoint test: [examples/get-collection.test.js](examples/get-collection.test.js)
- Unit tests: route to [strapi-testing](../strapi-testing/SKILL.md)

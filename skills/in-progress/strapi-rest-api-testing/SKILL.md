---
name: strapi-rest-api-testing
description: Bootstraps and writes REST API integration tests for Strapi 5 application projects using Jest, Supertest, and an isolated test database. Use when the user asks to test a REST endpoint, set up API tests, verify /api responses, or says "build me an API test for X endpoint".
---

# Strapi REST API integration testing

Write **in-process HTTP tests** (Supertest → `strapi.server.httpServer`). Not browser E2E. Not monorepo `yarn test:api`.

**Official harness reference (source of truth for the full Strapi test harness):** [Strapi 5 Testing guide — Create the Strapi test harness](https://docs.strapi.io/cms/testing#create-the-strapi-test-harness)

This skill adds **safe test-database setup**, **bootstrap gates**, **bundled templates**, and **helpers** on top of that guide.

## Hard rules

1. **Never use the dev or production database.** Tests run only with `NODE_ENV=test` and `config/env/test/database.js` (or equivalent env overrides). Run [scripts/verify-test-env.js](scripts/verify-test-env.js) before the first `setupStrapi()`.
2. **Do not write feature tests until the smoke test passes.** Bootstrap is incomplete until `tests/app.test.js` is green.
3. **Do not mark the task done until the requested test passes** (`yarn test` or `npm test`).
4. **Default stack:** Jest + Supertest + SQLite test DB. Do not introduce Vitest or a second runner on first setup unless the project already standardizes on Vitest everywhere.
5. **Do not pass `distDir` in the harness** unless the user explicitly needs it — see [REFERENCE.md](REFERENCE.md#dist-directory-pitfall).

## Workflow

### Phase 0 — Inventory

Check:

- `package.json` — existing test runner, `test` script
- `config/database.*` and `config/env/test/` — test DB already configured?
- `tests/strapi.js` or `tests/setup.js` — harness exists?
- Config file extensions (`.js` vs `.ts`) — determines harness variant (below)
- Content types under `src/api/` for the endpoint under test
- `@strapi/plugin-users-permissions` if auth is involved

If test infra is missing → Phase 1. If present but failing → fix harness first (Phase 2), then Phase 3.

### Phase 1 — Bootstrap (first time only)

**1. Install dependencies**

```bash
yarn add -D jest supertest sqlite3
# or: npm install --save-dev jest supertest sqlite3
```

**2. Test database** — copy [templates/config/env/test/database.js](templates/config/env/test/database.js) to the project. Default is isolated SQLite at `.tmp/test.db`. For Postgres/MySQL or CI options, see [REFERENCE.md](REFERENCE.md#test-database-options).

**3. Test harness** — choose one path:

| Project config | Harness |
| --- | --- |
| `config/*.js` / `config/*.json` only | Copy [templates/tests/strapi.js](templates/tests/strapi.js) |
| `config/*.ts` (or `.mts`/`.cts`) | Copy **all three** files from the [official guide](https://docs.strapi.io/cms/testing#create-the-strapi-test-harness): `tests/ts-compiler-options.js`, `tests/ts-runtime.js`, `tests/strapi.js` — do not improvise TS loader patches |

**4. Smoke test** — copy [templates/tests/app.test.js](templates/tests/app.test.js). It asserts `GET /_health` returns `204` (built-in Strapi health route).

**5. Helpers (optional now, needed soon)** — copy [templates/tests/helpers/](templates/tests/helpers/) when tests need auth or Content API permissions.

**6. `package.json` scripts and Jest config** — merge [templates/package.json.snippet.json](templates/package.json.snippet.json). The `test` script **must** set `NODE_ENV=test`.

**7. `.gitignore`** — ensure `.tmp/` is ignored.

**8. Verify environment** — copy [scripts/verify-test-env.js](scripts/verify-test-env.js) to `tests/verify-test-env.js`, then run:

```bash
NODE_ENV=test node tests/verify-test-env.js
```

### Phase 2 — Prove the harness (gate)

```bash
yarn test tests/app.test.js
```

- **Pass** → continue to Phase 3.
- **Fail** → fix bootstrap only (database config, env vars, TS harness, open handles). **Do not** add endpoint tests until this passes.

Common fixes: [REFERENCE.md](REFERENCE.md#troubleshooting)

### Phase 3 — Write the requested test

Place tests under `tests/integration/api/` (create the folder if needed).

Pattern:

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
  // 1. Seed via Document Service if needed
  // 2. Grant permissions if Content API returns 403
  // 3. Request + assert
  const res = await request(strapi.server.httpServer)
    .get('/api/articles')
    .expect(200);
  expect(res.body.data).toEqual(expect.any(Array));
});
```

- Seed data with `strapi.documents('api::type.type').create({ data, status: 'published' })` (Strapi 5).
- **403 on Content API** → use [templates/tests/helpers/permissions.js](templates/tests/helpers/permissions.js). See [REFERENCE.md](REFERENCE.md#content-api-permissions).
- **Auth** → use [templates/tests/helpers/auth.js](templates/tests/helpers/auth.js).

See [examples/get-collection.test.js](examples/get-collection.test.js).

### Phase 4 — Verify and finish

```bash
yarn test path/to/new.test.js
```

Iterate until green. Report: files added, how to run tests, which test DB option is active.

## Templates (copy into the user project)

| File | Purpose |
| --- | --- |
| [templates/config/env/test/database.js](templates/config/env/test/database.js) | Isolated test DB (default SQLite) |
| [templates/tests/strapi.js](templates/tests/strapi.js) | Harness for JS config projects |
| [templates/tests/app.test.js](templates/tests/app.test.js) | Smoke test (`/_health`) |
| [templates/tests/helpers/auth.js](templates/tests/helpers/auth.js) | JWT login helper |
| [templates/tests/helpers/permissions.js](templates/tests/helpers/permissions.js) | Grant role permissions in tests |
| [templates/package.json.snippet.json](templates/package.json.snippet.json) | `test` script + Jest block |

## Advanced

- Test DB options, safety checks, CI, Windows SQLite notes: [REFERENCE.md](REFERENCE.md)
- Example endpoint test: [examples/get-collection.test.js](examples/get-collection.test.js)
- Unit tests (mocked Strapi): route to [strapi-testing](../strapi-testing/SKILL.md) — use [official unit patterns](https://docs.strapi.io/cms/testing#mock-strapi-for-plugin-unit-tests) until `strapi-unit-testing` ships

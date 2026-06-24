---
name: strapi-testing
description: Routes Strapi 5 test requests to the right testing skill (REST API integration, unit, GraphQL). Use when the user asks to add tests, write tests, set up testing, or test an endpoint, service, controller, or API in their Strapi application project — not the Strapi monorepo.
---

# Strapi testing (router)

Pick the **right test type** before writing code. These skills target **user Strapi application projects** (a repo with `package.json`, `config/`, `src/api/`). They do **not** apply to the [Strapi monorepo](https://github.com/strapi/strapi) (`yarn test:api`, `api-tests/strapi`, contributor CI).

## Decision tree

| User wants to… | Skill |
| --- | --- |
| Test a REST route (`GET /api/...`, status code, JSON body, auth headers) | [strapi-rest-api-testing](../strapi-rest-api-testing/SKILL.md) |
| Test controller/service logic **without** starting Strapi or HTTP | `strapi-unit-testing` (planned — use [official unit-test patterns](https://docs.strapi.io/cms/testing#mock-strapi-for-plugin-unit-tests) until published) |
| Test GraphQL queries/mutations (`POST /graphql`) | `strapi-graphql-testing` (planned — only when `@strapi/plugin-graphql` is installed) |
| Test the admin UI in a browser (clicks, forms, Playwright) | Out of scope — see [Strapi E2E docs](https://docs.strapi.io) and Playwright; not these skills |
| Run or fix monorepo API integration tests | Stop — wrong repo; use Strapi contributor docs |

## Terminology (use consistently)

| Term | Meaning |
| --- | --- |
| **REST API integration test** | In-process HTTP test via Supertest against a real Strapi instance. **Default choice** for “test this endpoint”. |
| **Unit test** | Mocked `strapi` object; no server, no database. |
| **E2E (browser)** | Playwright/admin UI tests — **not** what “API E2E” means here. |

## Default recommendation

When the user says “build me an API test for X” without specifying a layer, use **REST API integration tests** unless they explicitly want mocked unit tests or GraphQL.

## Child skills

- **Ready (in progress):** [strapi-rest-api-testing](../strapi-rest-api-testing/SKILL.md)
- **Planned:** `strapi-unit-testing`, `strapi-graphql-testing`

---
name: strapi-repair
description: Diagnoses and repairs common Strapi 5 application project issues — won't start, admin/build failures, 403 API errors, pnpm/monorepo setup, and missing security defaults. Use when the user asks to fix, repair, debug, or harden their Strapi app (not the Strapi monorepo).
---

# Strapi repair

Fix **Strapi 5 application projects** (`package.json`, `config/`, `src/api/`). Not the [Strapi monorepo](https://github.com/strapi/strapi). Not v4→v5 migration (separate skill, out of scope).

## Hard rules

1. **Diagnose before destructive fixes** — don't delete `node_modules` first.
2. **Verify after each fix** — `strapi build`, `strapi develop`, or `GET /_health` (204).
3. **Don't mark done** until the reported symptom is resolved, or you've identified an upstream bug with a linked issue.
4. **Security hardening** — recommend by default on repair/audit; apply **breaking** changes only with explicit user approval (see [Security audit](#security-audit)).
5. **Prefer official docs and linked references** over inventing config — see [REFERENCE.md](REFERENCE.md).

## Triage

| Symptom | Start here |
| --- | --- |
| Won't start / crash on boot | [Environment & database](REFERENCE.md#environment--database) |
| Admin blank, chunk load error | [Admin & build](#admin--build-repair) |
| `strapi build` fails | [Package manager](#package-manager-repair) → admin repair |
| 403 on `/api/*` | [API "broken" (usually config)](REFERENCE.md#api-issues-usually-config-not-bugs) |
| Works locally, broken when deployed | [Deployment & URLs](REFERENCE.md#deployment--urls) |
| pnpm / monorepo | [Package manager](#package-manager-repair) |
| "Secure" / "harden" / general repair | [Security audit](#security-audit) at end |

Run read-only scripts first (copy into project or run from skill path):

```bash
node scripts/diagnose.js
node scripts/audit-security.js
```

## Workflow

### Phase 0 — Gather facts

- Strapi version (`package.json`)
- Package manager + version (`pnpm -v`, lockfile type)
- Error message / logs (full stack trace)
- Dev vs production, reverse proxy, monorepo layout
- Recent changes (upgrade, schema edit, env edit)

### Phase 1 — Least-invasive fix

Pick **one** matching playbook below. Apply the smallest change that could fix the symptom.

### Phase 2 — Verify

```bash
# Pick what fits the symptom
strapi build
strapi develop
curl -s -o /dev/null -w "%{http_code}" http://localhost:1337/_health   # expect 204
```

### Phase 3 — Escalate if still broken

Follow the [clean reinstall ladder](REFERENCE.md#clean-reinstall-ladder) in order.

### Phase 4 — Security audit (default on repair)

Unless the user opted out of config changes, run `audit-security.js` and report gaps. Apply safe items; propose breaking items for approval. Source: [PR #26737 security defaults](https://github.com/strapi/strapi/pull/26737) and [REFERENCE.md — Security](REFERENCE.md#security-hardening-pr-26737).

## Admin & build repair

Official references:

- [Build command](https://docs.strapi.io/cms/cli#strapi-build)
- [Develop command](https://docs.strapi.io/cms/cli#strapi-develop)

Try in order:

1. `strapi build` — required after upgrades or admin customizations.
2. Clear stale admin artifacts: `.strapi/client`, `.cache` (project layout may vary).
3. `strapi develop --watch-admin` for local admin dev.
4. Hard browser refresh / disable cache — common for "Failed to fetch dynamically imported module" ([issue #20870](https://github.com/strapi/strapi/issues/20870)).
5. Confirm `react`, `react-dom`, `styled-components`, `react-router-dom` are in the **app** `package.json` (Strapi checks these on build).

If still failing after rebuild → package manager repair, then reinstall ladder.

## Package manager repair

### pnpm (especially v11+)

Official pnpm migration: [Migrating to v11](https://pnpm.io/migration) — config moves from `package.json#pnpm` and most `.npmrc` settings to **`pnpm-workspace.yaml`**.

Strapi-specific (community workarounds, not Strapi bugs):

| Problem | Reference |
| --- | --- |
| `catalog:` version errors on build | [issue #22849](https://github.com/strapi/strapi/issues/22849) — `USE_EXPERIMENTAL_DEPENDENCIES=true` |
| Admin can't resolve React deps | [issue #15992](https://github.com/strapi/strapi/issues/15992), [discussion #25404](https://github.com/strapi/strapi/discussions/25404) — hoisting in `pnpm-workspace.yaml` |
| Monorepo layout | Keep Strapi peer deps in each app's `package.json` |

Full checklist: [REFERENCE.md — pnpm](REFERENCE.md#pnpm--monorepo).

### yarn / npm

- Lockfile + `node_modules` corruption → [clean reinstall ladder](REFERENCE.md#clean-reinstall-ladder).
- Duplicate React → `yarn why react` / `npm ls react`.

## Security audit

**Source of truth:** [PR #26737](https://github.com/strapi/strapi/pull/26737) (feat: security defaults for new apps). Existing projects should adopt the same values manually until documented on [docs.strapi.io](https://docs.strapi.io).

Run `node scripts/audit-security.js` — read-only report of what's present vs missing.

| Item | Safe to apply without asking? |
| --- | --- |
| Missing `JWT_SECRET` in `.env` | Yes — generate and add |
| `webhooks.populateRelations: false` if unset | Usually yes |
| `strictParams: true` | **No** — breaks clients with unknown query params |
| `jwtManagement: 'refresh'` + httpOnly sessions | **No** — breaks legacy JWT-only clients |
| Upload allow/deny MIME lists | **No** — may block existing upload types |
| Production CORS / SSL / proxy | **No** — needs deployment context |

Also recommend for production (from PR doc): restrict CORS, `DATABASE_SSL`, `server.proxy` behind reverse proxy. Details: [REFERENCE.md — Security](REFERENCE.md#security-hardening-pr-26737).

## Related skills

- REST API test setup / 403 in tests → [strapi-rest-api-testing](../strapi-rest-api-testing/SKILL.md)
- Test type routing → [strapi-testing](../strapi-testing/SKILL.md) (if present)

## Advanced

- WAIBU issue index, deployment, env/DB, reinstall ladder: [REFERENCE.md](REFERENCE.md)

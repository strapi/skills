# Companion skills — registry & discovery

`strapi-product-builder` is a **planner**. The actual build work is delegated to separate **companion skills** *when they happen to be installed*. This file is the single source of truth for which companions exist, what capability each provides, and what to do when one is **not** present.

> ⚠️ **These are not (yet) official Strapi skills.** They are experimental skills that live in separate repos / local installs. Most users who run `strapi-product-builder` will have **none** of them. The skill must work anyway. **Never treat a companion as a hard dependency.**

## The two rules

1. **Capability-first.** Reason about *capabilities* ("scaffold Strapi", "set up auth", "dockerize") — not skill names. A companion skill is only an optional accelerator for a capability.
2. **Discover, don't assume.** Before invoking any companion, confirm it's actually available in the current session (Claude Code lists available skills; Claude Desktop / claude.ai web normally have none). If present → invoke it. If absent → write the **fallback** into the stage-6 spec so the user can do it by hand.

Companion names that appear in stages 4–6 of `SKILL.md` are **illustrative** — this registry plus the availability check are what actually govern.

## Registry

| Capability | Skill | Status | Surface / constraints | Fallback when the skill is absent |
|---|---|---|---|---|
| Scaffold a Strapi project + content types + seed data + public permissions | `strapi-configuration` | experimental | — | `npx create-strapi-app@latest` (see the 06 template setup commands) + the schemas from stage 5; set Public `find`/`findOne` permissions manually. Verify against https://docs.strapi.io |
| End-user auth via Better Auth (the three plugins) | `better-auth-setup` | experimental | wires a **Next.js** frontend | full manual steps live in `references/auth-better-auth.md`; cross-check the Better Auth tutorial in `resources.md` |
| Add a content-type-backed page + nav link | `add-page` | experimental | **Astro frontends only** | create the content type (stage-5 schema) + add the page/route in the chosen framework's convention (see `frontend-frameworks.md`) |
| Scaffold a custom field plugin | `strapi-custom-field` | experimental | — | `npx @strapi/sdk-plugin init` + a field component; verify against the Strapi custom-fields docs |
| Dockerize Strapi (self-host) | `dockerize-strapi` | experimental | only when **not** using Strapi Cloud | Dockerfile + `docker-compose.yml` (with Postgres) per the Strapi Docker guide on https://docs.strapi.io |

`status`: `experimental` = local/unofficial — **flag this to the user** and add an "(experimental — verify before relying on it)" note in the spec · `official` = promoted and tested — safe to recommend confidently.

## Adding a new companion (the extensible bit)

When a new build skill appears, you do **not** edit prose across the stages. You just:

1. **Add one row** above (capability · skill name · `status: experimental` · constraints · fallback).
2. **Make the fallback real** — the stage-6 spec must remain fully executable without the skill.
3. (Optional) add matching authoritative links to `references/resources.md`.
4. When it's promoted, run the checklist below and flip `status → official`.

## Promotion: local experiment → official Strapi skill

A companion stays `experimental` in this registry until it clears:

- [ ] **Moved** to the canonical Strapi skills repo (consolidate the scattered local copies into one source of truth)
- [ ] **Organized** to the [agentskills.io](https://agentskills.io/specification.md) spec (SKILL.md frontmatter, `references/`, `templates/`)
- [ ] **Tested** end-to-end on a clean environment (use the `test-tutorial-post` skill, or build it from scratch and confirm each step works)
- [ ] **Owned + versioned** (assigned owner, tagged release)
- [ ] **Registered** here with `status: official` (and resources added to `resources.md`)

Only `official` companions are advertised confidently in generated specs.

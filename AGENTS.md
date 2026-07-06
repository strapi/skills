# AGENTS.md

Guidance for AI coding agents working in this repository.

## Keep the README in sync with the skills catalog

The [`README.md`](./README.md) "Available skills" table is the user-facing index of every skill shipped from this repo. It must stay in sync with the actual contents of [`skills/`](./skills).

**When you create, update, or delete a skill (CRUD on anything under `skills/`), update `README.md` in the same change:**

- **Create** — add a row to the "Available skills" table: skill name, one-line description (match the `description` frontmatter), and a link to the skill directory (`./skills/<category>/<name>`).
- **Update** — if a skill's `name`, `description`, or location changes, update its row to match. Keep the description in the README consistent with the `SKILL.md` frontmatter.
- **Delete** — remove its row from the table.

Rules:

- The README table is the source of truth for users browsing the repo; the `SKILL.md` files are the source of truth for the table. Always derive the README from the `SKILL.md` frontmatter, not the other way around.
- Do not list skills under `skills/in-progress/` in the README — those are not yet public.
- If you add a new top-level category under `skills/`, mention it in the README if it changes how users discover skills.
- After editing, verify every README row points to a path that exists and every published `SKILL.md` under `skills/` has a row.

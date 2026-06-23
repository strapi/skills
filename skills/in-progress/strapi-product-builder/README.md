# strapi-product-builder

> ⚠️ **Work in progress (experimental).** This skill lives in `skills/in-progress/` — it's still being refined, not yet reviewed for production use, and its conventions may change. Feedback welcome.

A Claude skill that turns a fuzzy product idea into a build-ready spec for a **Strapi v5 + Strapi Cloud** project — with the frontend of your choice (first-class support for Next.js, TanStack Start, Astro, and Vue/Nuxt) — through a six-stage interview.

The output is six markdown files (`01-product.md` through `06-claude-code-spec.md`) — the last one is detailed enough that a fresh Claude Code session can start building the POC immediately.

---

## What you get

- Business-value-first interview (product → users → requirements → tech → tech spec → build spec)
- Opinionated Strapi defaults you can override:
  - Backend: **Strapi v5** on **Strapi Cloud** with PostgreSQL
  - Frontend: **your choice** — first-class support for **Next.js, TanStack Start, Astro, Vue/Nuxt** (asked every time, no silent default)
  - Auth: **`@strapi-community/plugin-better-auth`** ⚠️ *(currently beta — maintainers say not for production; needs Strapi ≥ 5.45 and removes Users & Permissions)*, or stock **Users & Permissions** for production/conservative builds
  - Styling: Tailwind
- *Optionally* accelerates the build with companion Claude Code skills **when they're installed** (`strapi-configuration`, `better-auth-setup`, `add-page` [Astro only], `dockerize-strapi`, `strapi-custom-field`) — these are experimental/optional and most users won't have them, so the generated spec always works without them. See the registry in `references/companions.md`.
- **Optional Strapi MCP server** — if the product needs AI agents to read/write its content, stage 4 can enable Strapi's built-in MCP server (v5.47+, beta). Off by default. See `references/strapi-mcp-server.md`.
- Uses the `strapi-docs` MCP for fact-checking when installed; falls back to https://docs.strapi.io

## Folder layout

```
strapi-product-builder/
├── SKILL.md                  # entry point — instructions + stage flow
├── README.md                 # you are here
├── references/               # opinions, defaults, deeper guidance
├── templates/                # per-stage output templates
├── examples/                 # filled-in worked example(s) — e.g. `trailhead/`
└── scripts/                  # optional helpers (placeholder)
```

---

## Install

This skill works in **Claude Code**, **Claude Desktop**, and **claude.ai web**. Pick the install path for your surface — the skill content itself is identical across all three.

### Claude Code (recommended for the full experience)

Clone this repo, then copy the skill into a skills folder.

Personal install (available in every project on this machine):

```bash
git clone https://github.com/strapi/skills.git
cp -R skills/skills/in-progress/strapi-product-builder ~/.claude/skills/
```

Project install (only available inside one project). Prefer the cross-agent path **`.agents/skills/`** ([Agent Skills](https://agentskills.io/specification.md)); many teams symlink **`.claude/skills`** → **`.agents/skills`** for Claude Code.

```bash
mkdir -p /path/to/your/project/.agents/skills
cp -R skills/skills/in-progress/strapi-product-builder /path/to/your/project/.agents/skills/
```

Then start a new Claude Code session — the skill will be auto-discovered. Verify with `/help` (it should appear in the available skills list).

> Why Claude Code is best: filesystem writes, MCP support, and you can chain into companion skills (`strapi-configuration`, `add-page`, etc.) directly after stage 6 — *when those skills are installed* (they're optional; the spec works without them).

### Claude Desktop

Claude Desktop installs skills from a **zip**. Create one from your clone:

```bash
cd skills/skills/in-progress
zip -r strapi-product-builder.zip strapi-product-builder
```

Then:

1. Open **Claude Desktop** → **Settings** → **Capabilities** → **Skills**.
2. Click **Upload skill** and select `strapi-product-builder.zip`.
3. Enable the skill.

> **Updating later:** remove the existing version first, then re-upload a fresh zip. Editing files on disk won't change an already-registered skill.

If you don't see a Skills section, your Desktop version may not have it yet — update Claude Desktop, then retry.

For docs lookup, also install a Strapi docs MCP server if you have one — Settings → Connectors → Add MCP server. Otherwise the skill will fall back to web fetching `docs.strapi.io`.

### claude.ai (web)

1. Go to https://claude.ai → click your profile → **Settings** → **Capabilities** → **Skills**.
2. Click **Upload skill** and select `strapi-product-builder.zip` (create it as shown above).
3. Enable the skill.

The skill renders each stage's output as an **artifact** you can copy or download. The final stage-6 spec is what you'll paste into a future Claude Code session to actually build.

> Note: claude.ai web can't write files to your machine and can't invoke companion skills directly. It produces the spec; you run the build elsewhere.

### Verifying the install (any surface)

Start a new conversation and say:

> Use the strapi-product-builder skill — I have an idea for [whatever]

Claude should pick up the skill and begin stage 1. If it doesn't, check that the skill is enabled in Settings → Capabilities → Skills.

---

## Usage

### Triggering the skill

Any of these will trigger it (or you can be explicit with the skill name):

- "I have an idea for an app — help me plan it"
- "Let's spec out a Strapi project"
- "Help me build a [blog / e-commerce site / portfolio / SaaS] with Strapi"
- "Turn this idea into a PRD"
- `/strapi-product-builder` (in Claude Code)

### What to expect

The skill runs as a **structured interview** — six stages, one at a time:

| Stage | What it captures | File |
|---|---|---|
| 1 | What the product is + the value it delivers | `01-product.md` |
| 2 | Personas, JTBD, user journey, core loop | `02-users.md` |
| 3 | Functional requirements (capability-level, not tech) | `03-requirements.md` |
| 4 | Tech decisions (Strapi backend default; you pick the frontend + auth) | `04-tech-decisions.md` |
| 5 | Strapi schemas, API surface, auth flows, route tree | `05-tech-requirements.md` |
| 6 | Build-ready Claude Code spec with milestones | `06-claude-code-spec.md` |

You can jump back and revise any earlier stage at any time — the skill will ask whether downstream files need to be updated.

**The output** is a project folder with those six `.md` files (in Claude Code/Desktop) or six copyable artifacts (claude.ai web). `06-claude-code-spec.md` is the deliverable — a self-contained build spec (stack, repo layout, setup commands, milestones, schemas, API surface, auth, env vars, deployment) you hand to a fresh Claude Code session to actually build the project.

> **See real output first:** [`examples/trailhead/`](examples/trailhead/) is a complete worked example — all six files for a sample product.

### Tips

- **Don't lead with tech.** The skill steers business-value first. Trust the order.
- **Pick your frontend in stage 4.** The skill asks; Next.js, TanStack Start, Astro, and Vue/Nuxt are first-class, but any framework works.
- **Auth is a real choice.** The Better Auth plugin is modern but currently beta (not for production per its maintainers); pick stock Users & Permissions if you're launching soon.
- **Bring real constraints.** Compliance, region, team skills, budget — surface them in stage 1-3 so they shape the spec.
- **Use the spec to start a new Claude Code session.** Stage 6 is self-contained — open Claude Code in a fresh repo, paste it, and start with milestone 1.

### After the spec is done

The stage-6 spec is **self-contained** — you can build straight from it with no other skills installed. The companion skills below are *optional accelerators* (experimental — see `references/companions.md`); if you happen to have them, they speed up the matching step, otherwise the spec already contains the manual steps.

In **Claude Code**:

```
> build from @06-claude-code-spec.md
# If these optional companion skills are installed, use them for the matching step:
#   strapi-configuration  → scaffold the backend + content types
#   better-auth-setup     → wire Better Auth (only if you chose that path)
#   add-page              → add a content-backed page later (Astro frontends only)
#   dockerize-strapi      → only if you opted out of Strapi Cloud
```

In **Desktop** or **web**: copy `06-claude-code-spec.md` and paste it as the first message in a Claude Code session.

---

## Updating the skill

**To get the latest version (if you installed it):**

- **Claude Code** → `git pull` in your clone, then re-copy the folder (or just `git pull` if you symlinked it) and start a new session.
- **Claude Desktop / web** → remove the installed skill, then re-upload a fresh zip (editing files won't update a registered skill).

**To edit the skill (authoring):**

The skill is just files in a folder. To update opinions or add references:

- Add a new opinion → drop it in `references/` and link it from `SKILL.md`.
- Add a companion skill or external doc/blog → register it in `references/companions.md` or `references/resources.md` (one row each) rather than hardcoding it in the stages.
- Tweak a stage's output → edit the matching file in `templates/`.
- Add a worked example → make a folder under `examples/` with the six output files.
- Add a helper → drop it in `scripts/` and document it in `scripts/README.md`.

After editing, re-upload (Desktop / web) or just save in place (Claude Code — changes pick up on the next session).

---

## Troubleshooting

- **Skill doesn't trigger** → ensure it's enabled in Settings → Capabilities → Skills, or call it by name.
- **Strapi docs lookups fail** → install a Strapi docs MCP, or rely on `WebFetch` against `https://docs.strapi.io` (works on every surface).
- **`create-strapi-app` flags don't match** in a new session → Strapi's CLI changes; let Claude check the current docs before running the install commands in the spec.
- **Better Auth callback errors after deploy** → `STRAPI_URL` (used as the Better Auth `baseURL`) must equal the deployed Strapi Cloud URL exactly, and provider redirect URIs (`<STRAPI_URL>/api/auth/callback/<provider>`) must be updated to match.

---

## License / attribution

Plugins and tools referenced:
- Strapi: https://strapi.io
- Strapi Cloud: https://cloud.strapi.io
- TanStack Start: https://tanstack.com/start
- Better Auth plugins for Strapi (monorepo of three): https://github.com/strapi-community/plugin-better-auth
- Better Auth: https://better-auth.com

# Strapi Skills

A collection of **public agent skills** that help you build Strapi applications with AI coding assistants (Cursor, Claude Code, Codex, and more).

Skills are reusable `SKILL.md` instruction files that coding agents load for domain-specific tasks. The skills in this repo encode Strapi 5 conventions and workflows so assistants follow official Strapi patterns and best practices.

These skills are distributed through the [open agent skills ecosystem](https://www.skills.sh) and installed with the [`skills` CLI](https://github.com/vercel-labs/skills) (`npx skills`).

## Available skills

| Skill | Description |
| ----- | ----------- |
| [`strapi-docs-mcp`](./skills/cms/strapi-docs-mcp) | Query the official Strapi documentation through the `strapi-docs` MCP server (powered by Kapa). Use for any Strapi question — API syntax, configuration, features, plugins, upgrades, CLI. |
| [`strapi-mcp-capabilities`](./skills/cms/strapi-mcp-capabilities) | Create custom MCP capabilities (tools, prompts, resources) in a Strapi 5 plugin via the `strapi.ai.mcp` service. |

More skills will be added over time. Browse the [`skills/`](./skills) directory for the full list.

## What are agent skills?

Agent skills are reusable instruction sets that extend a coding agent's capabilities. Each skill is a directory containing a `SKILL.md` file with YAML frontmatter (`name` + `description`) and a Markdown body of instructions the agent follows when the skill is activated.

## Requirements

- [Node.js](https://nodejs.org) (to run `npx skills`)
- A supported coding agent (Cursor, Claude Code, Codex, OpenCode, Gemini CLI, GitHub Copilot, Windsurf, Cline, etc.). The CLI auto-detects installed agents; if none are detected, you'll be prompted to pick one.

## Install the Strapi skills

The `skills` CLI resolves sources from GitHub shorthand, full URLs, direct paths, GitLab URLs, any git URL, or local paths.

```bash
# Install all Strapi skills (interactive)
npx skills add strapi/skills

# List the skills available in this repo without installing
npx skills add strapi/skills --list

# Install a specific skill
npx skills add strapi/skills --skill strapi-docs-mcp

# Install a single skill by direct path
npx skills add https://github.com/strapi/skills/tree/main/skills/cms/strapi-docs-mcp
```

### Choose where skills are installed

| Scope | Flag | Location | Use case |
| ----- | ---- | -------- | -------- |
| **Project** | _(default)_ | `./<agent>/skills/` | Committed with your Strapi project, shared with the team |
| **Global** | `-g` | `~/<agent>/skills/` | Available across all your projects |

```bash
# Project-scoped (recommended for Strapi apps — committed so the whole team shares it)
npx skills add strapi/skills --skill strapi-docs-mcp -a cursor -y

# Global (personal, available in every project)
npx skills add strapi/skills --skill strapi-docs-mcp -g -a cursor -y
```

## Setting up skills inside a Strapi app

The recommended setup for a Strapi project is **project-scoped** installation: skills land in `./<agent>/skills/` and are committed, so everyone on the team gets the same Strapi guidance.

From the root of your Strapi app:

```bash
# 1. Install the docs skill for your agent (example: Cursor)
npx skills add strapi/skills --skill strapi-docs-mcp -a cursor -y

# 2. Commit the installed skill so the team shares it
git add .agents/skills/strapi-docs-mcp
git commit -m "chore: add strapi-docs-mcp agent skill"
```

Then restart/reload your agent so it picks up the new skill. In Cursor, skills in `.agents/skills/` are loaded automatically on the next session.

### Recommended skills for a Strapi app

- **Always:** `strapi-docs-mcp` — keeps the agent grounded in the official, up-to-date docs instead of its training data.
- **When building a plugin that extends the Strapi MCP server:** `strapi-mcp-capabilities` — guides the `strapi.ai.mcp` registration patterns, lifecycle rules, and Zod schemas.

```bash
npx skills add strapi/skills \
  --skill strapi-docs-mcp \
  --skill strapi-mcp-capabilities \
  -a cursor -y
```

### Pair skills with the Strapi MCP server

For the best results, also connect your agent to a Strapi MCP server so it can act on a live Strapi instance, not just answer doc questions:

- **Docs server** (read-only Strapi documentation): `https://strapi-docs.mcp.kapa.ai` — OAuth flow on first connection. See [connection details](https://docs.strapi.io/cms/ai/docs-mcp-server#connection-details).
- **Instance server** (read/write your running Strapi): enable `config/server.ts` → `mcp: { enabled: true }`, then connect to `POST http://localhost:1337/mcp` with `Authorization: Bearer <admin-token>`. Requires Strapi 5.47.0+. See the [Strapi MCP server docs](https://docs.strapi.io/cms/features/strapi-mcp-server).

The `strapi-docs-mcp` skill knows how to detect the docs server, use it if present, and fall back to the `llms.txt` / per-page Markdown sources if it isn't.

```bash
# List installed skills (project + global)
npx skills list

# List only global skills
npx skills ls -g

# Search the ecosystem for Strapi-related skills
npx skills find strapi

# Update installed skills to their latest version
npx skills update

# Update a specific skill
npx skills update strapi-docs-mcp

# Remove a skill
npx skills remove strapi-docs-mcp

# Create a new SKILL.md template (for authoring your own)
npx skills init my-skill
```

## Creating your own Strapi skill

A skill is a directory with a `SKILL.md` containing YAML frontmatter:

```markdown
---
name: my-strapi-skill
description: What this skill does and when to use it. The agent reads this to decide when to activate it.
---

# My Strapi Skill

Instructions for the agent to follow when this skill is activated.

## When to use

Describe the scenarios where this skill should be used.

## Steps

1. First, do this
2. Then, do that
```

Required frontmatter: `name` (lowercase, hyphens allowed) and `description`. Optional: `metadata.internal: true` to hide a work-in-progress skill from normal discovery (install with `INSTALL_INTERNAL_SKILLS=1`).

Scaffold a new skill in your Strapi plugin repo:

```bash
npx skills init my-strapi-skill
```

Then commit it under `skills/<name>/SKILL.md` and install it locally to test:

```bash
npx skills add ./path/to/my-strapi-skill -a cursor -y
```

## Troubleshooting

- **"No skills found"** — ensure the repo contains valid `SKILL.md` files with both `name` and `description` in the frontmatter. Run `npx skills add strapi/skills --list` to verify discovery.
- **Skill not loading in agent** — confirm the skill was installed to the correct path for your agent (see the table above), restart/reload the agent, and verify the `SKILL.md` frontmatter is valid YAML.
- **Permission errors** — ensure write access to the target directory (`./<agent>/skills/` or `~/<agent>/skills/`).
- **Symlinks unsupported** — reinstall with `--copy`.

## Links

- [Strapi documentation](https://docs.strapi.io)
- [Strapi on GitHub](https://github.com/strapi/strapi)
- [Skills CLI (vercel-labs/skills)](https://github.com/vercel-labs/skills)
- [Skills directory (skills.sh)](https://www.skills.sh)
- [Skills docs](https://www.skills.sh/docs)
- [Strapi docs MCP server](https://docs.strapi.io/cms/ai/docs-mcp-server)
- [Strapi MCP server](https://docs.strapi.io/cms/features/strapi-mcp-server)

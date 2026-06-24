# Resources — curated external references

Authoritative external sources the skill can cite when generating stage-5/6 output, tagged by capability. Citing the right one lets the future Claude Code build session verify the API surface before generating code.

## How to use these

- **The durable source of truth is the official docs** — https://docs.strapi.io and the `strapi-docs` MCP. Cite these first.
- **Blog tutorials are walkthroughs, not specs.** They drift as Strapi evolves. **Re-verify a post's exact commands and version numbers against current docs (or the `strapi-docs` MCP) before pasting them into a build spec.** Each entry below records the version it targeted and its publish date so staleness is visible at a glance.
- When stage 5 or 6 touches a non-obvious feature, link the matching resource in the output file.

## Registry

| Topic / capability | Resource | Type | Targets | Date |
|---|---|---|---|---|
| Strapi (general) | https://docs.strapi.io | official-docs | v5 (current) | live |
| Strapi Cloud deploy | https://docs.strapi.io/cloud/getting-started/intro | official-docs | v5 | live |
| Better Auth — setup | *Strapi Better Auth Tutorial: Setup Guide for Strapi v5 and Next.js 16* — https://strapi.io/blog/strapi-better-auth-tutorial-setup-guide-for-strapi-v5-and-next-js-16 | strapi-blog | Strapi v5 (5.45+), Next.js 16 | 2026-05-21 |
| Better Auth — plugins | https://github.com/strapi-community/plugin-better-auth | reference-repo | v5 | live |
| Better Auth — library | https://better-auth.com | official-docs | — | live |
| Strapi MCP server (built-in feature) | https://docs.strapi.io/cms/features/strapi-mcp-server | official-docs | Strapi v5 (5.47+, beta) | live |
| Extend the Strapi MCP server with custom tools (plugin) | *How To Extend Strapi's MCP Server With Custom Tools via a Plugin* — https://strapi.io/blog/how-to-extend-strapi-s-mcp-server-with-a-custom-tools-via-a-plugin | strapi-blog | Strapi v5 (5.47+) | 2026-06-13 |
| Next.js + Strapi starter | https://github.com/strapi/LaunchPad — Official Strapi Demo application | reference-repo | v5 | live |
| Lifecycle hooks vs Document Service middleware | *What are Document Service Middleware, and What Happened to Lifecycle Hooks?* — https://strapi.io/blog/what-are-document-service-middleware-and-what-happened-to-lifecycle-hooks-1 | strapi-blog | Strapi v5 | 2025-02-13 |
| When to use lifecycle hooks | *When To Use Lifecycle Hooks in Strapi* — https://strapi.io/blog/when-to-use-lifecycle-hooks-in-strapi | strapi-blog | Strapi v5 | 2025-02-26 |
| Customizing via register() | *How To Use Register Function To Customize Your Strapi App* — https://strapi.io/blog/how-to-use-register-function-to-customize-your-strapi-app | strapi-blog | Strapi v5 | 2025-02-27 |

`type`: `official-docs` (durable — cite freely) · `strapi-blog` (walkthrough — re-verify commands/versions before use) · `reference-repo` (example code to read, not copy blindly).

## Adding a resource (the extensible bit)

Append one row: topic/capability · title + URL · type · version targeted · publish date. Prefer official docs as the anchor; add blog tutorials as supplements, always with their **version + date** so future sessions can judge whether they've gone stale.

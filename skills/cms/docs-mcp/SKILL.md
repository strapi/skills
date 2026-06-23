---
name: strapi-docs-mcp
description: Query the official Strapi documentation through the strapi-docs MCP server (powered by Kapa). Use for any Strapi question — API syntax, configuration, features, plugins, upgrades, CLI. If the server is missing, instruct the user how to install it.
---

# Strapi docs MCP server

The `strapi-docs` MCP server (URL: `https://strapi-docs.mcp.kapa.ai`) exposes the full Strapi documentation (guides, API references, code examples). Prefer it over training data for Strapi answers, which may be outdated.

Canonical source: https://docs.strapi.io/cms/ai/docs-mcp-server

## Step 1 — Detect availability

Check whether a `strapi-docs` MCP server / tool is connected in the current environment.

- **Available** → go to *Use it*.
- **Not available** → go to *Install it*.

## Available: Use it

Call the `strapi-docs` MCP tools to answer Strapi questions. Pass the user's question directly; quote exact API names, config keys, and versions returned. Cite doc links in the answer.

## Not available: Install it

Add a remote HTTP MCP server named: `strapi-docs` (URL `https://strapi-docs.mcp.kapa.ai`) to the host tool's MCP config, using its standard format. The server uses **OAuth** — the user completes an auth flow on first connection. Then have them reload/restart so it connects.

Per-tool config formats: https://docs.strapi.io/cms/ai/docs-mcp-server#connection-details

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

## Last resort: Query the docs content directly

If the MCP server is unavailable **and** can't be installed, fall back to the public documentation content. No authentication is required for any of these. Prefer them in this order.

### 1. Per-page Markdown (simplest — add `.md` to any page URL)

Any documentation page is available as flat Markdown by appending `.md` to its URL. All layout components (tabs, accordions, API blocks) are resolved to plain text, so nothing is hidden.

- Page URL:     `https://docs.strapi.io/cms/backend-customization/controllers`
- Markdown URL: `https://docs.strapi.io/cms/backend-customization/controllers.md`
- Pattern: append `.md` to any `https://docs.strapi.io/<page-path>`

This is the same content the docs site's **Copy Markdown** button uses.

### 2. LLMs text files (best when you need many pages at once — flat, nothing hidden)

These follow the [llms.txt convention](https://llmstxt.org/) and are the most agent-friendly source: content is flattened to plain Markdown, so nothing is hidden inside tabs or accordions.

| File | URL | Use for |
|------|-----|---------|
| Index | `https://docs.strapi.io/llms.txt` | Discover every page: a link-rich list of all pages with one-line summaries. |
| Full content | `https://docs.strapi.io/llms-full.txt` | The entire documentation in a single file. Fetch once, then search/grep in it. |
| Code only | `https://docs.strapi.io/llms-code.txt` | All code examples, grouped by page. |

  **Constructing a page URL from `llms.txt`:** entries are protocol-relative paths like `//cms/backend-customization/controllers`. Prepend the docs origin to get the live page as follows:

`//cms/backend-customization/controllers` becomes `https://docs.strapi.io/cms/backend-customization/controllers`

### 3. Raw Markdown source on GitHub (per-page, authoritative)

Each page is a `.md`/`.mdx` file in [`strapi/documentation`](https://github.com/strapi/documentation). Use this only if `docs.strapi.io` itself is unreachable. Build the raw URL from the page path:

- Page path:   `/cms/backend-customization/controllers`
- Raw URL: `https://raw.githubusercontent.com/strapi/documentation/main/docusaurus/docs/cms/backend-customization/controllers.md`
- Pattern:
  `https://raw.githubusercontent.com/strapi/documentation/main/docusaurus/docs/<page-path>.md`
  where `<page-path>` is the page URL path (drop the leading `/`). Some pages use `.mdx` — if `.md` returns 404, retry with `.mdx`.

### 4. Live HTML page (last resort)

Fetch the page directly, e.g. `https://docs.strapi.io/cms/backend-customization/controllers`, and extract the content. Least reliable: some content lives in tabs/accordions and may be missed. Prefer sources 1 to 3 whenever possible.

# Looking up Strapi facts

Strapi v5 changed a lot from v4 (`documentId`, the Document Service API, the Blocks editor, etc.) and the docs evolve. Don't recall facts — look them up.

## Order of preference

1. **`strapi-docs` MCP** — if a Strapi docs MCP server is connected (any tool whose name matches `mcp__strapi-docs__*` or similar), prefer it. It usually returns better-targeted snippets than a web fetch and is cheaper to call.
2. **`WebFetch` against https://docs.strapi.io** — fall back when the MCP isn't available. Fetch the specific page, not the homepage. Good entry points:
   - https://docs.strapi.io — root
   - https://docs.strapi.io/cms/intro — CMS docs (most of what this skill needs)
   - https://docs.strapi.io/cloud/getting-started/intro — Strapi Cloud
   - https://docs.strapi.io/cms/api/rest — REST API
   - https://docs.strapi.io/cms/api/rest/populate-select — populate (the thing you'll look up most often)
   - https://docs.strapi.io/cms/api/document-service — Document Service (v5)
   - https://docs.strapi.io/cms/backend-customization/models — content-type schemas + lifecycles
   - https://docs.strapi.io/cms/migration — v4 → v5 migration if relevant
3. **`WebSearch`** — only when you don't know the URL and the MCP didn't help. Good for plugin docs, community articles, or version-specific notes.

## When to actually look things up

- About to write a `populate` query (always check current syntax)
- About to write a lifecycle hook signature
- About to write a custom controller, policy, or middleware
- Touching the Document Service vs. Entity Service (v4 vs. v5 difference)
- Anything about i18n, draft & publish, or RBAC
- Plugin install steps or config keys
- Strapi Cloud env vars or deploy steps

## When NOT to bother

- Basic field types, basic relations, basic admin UI navigation — those are stable across recent versions.
- High-level concepts (what's a content type, what's a component) — already covered in `references/content-modeling.md`.

## Citing in stage outputs

When stage 5 or stage 6 references a non-obvious feature, **link the docs page** in the file. Future Claude Code sessions reading the spec can re-verify the API surface in one click rather than re-deriving it.

## If lookup fails

If neither the MCP nor the docs are reachable, write the section with an explicit caveat — e.g.:

> ⚠️ Could not verify lifecycle hook signature against current docs. Check https://docs.strapi.io/cms/backend-customization/models#lifecycle-hooks before implementing.

Don't fabricate API shapes. A flagged unknown is more useful than a wrong-but-confident answer.

## Surface notes

- **Claude Code**: `WebFetch` and MCP both work natively. Use them freely.
- **Claude Desktop**: same — MCPs and web access available.
- **claude.ai web**: web-based browsing tools are available; MCPs may or may not be (depends on connector setup). Behave the same way; just be aware that some lookups may fall back to search results.

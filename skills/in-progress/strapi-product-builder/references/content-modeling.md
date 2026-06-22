# Strapi v5 content modeling primer

Use this when filling in **stage 5** schemas. Look up specifics via the `strapi-docs` MCP or https://docs.strapi.io before writing schema JSON.

## The four primitives

| Primitive | When to use | API shape |
|---|---|---|
| **Collection type** | Entities you have many of (articles, products, users, events). Each entry has its own URL/id. | `/api/articles`, `/api/articles/:documentId` |
| **Single type** | Entities there's exactly one of (Global header, Homepage, Settings, About page). | `/api/global`, `/api/homepage` |
| **Component** | A reusable shape used inside one or more content types (SEO block, CTA, address). Lives in `src/components/<category>/<name>.json`. | Embedded in the parent's response under the field name. |
| **Dynamic zone** | A field that holds an *ordered list of components*, where each item can be a different component shape. Use for page builders. | Returned as an array with `__component` discriminator. |

Rule of thumb: **components for reuse, dynamic zones for flexibility.** A "page builder" Page collection has a `blocks` dynamic zone that accepts `blocks.hero | blocks.feature-grid | blocks.cta | blocks.faq`.

## Field types you'll actually use

- `string` (max 255), `text`, `richtext` (the **legacy Markdown** editor), and `blocks` — in v5 the modern editor is its own field **type** `blocks` (`"type": "blocks"` in the schema), which returns structured JSON, not Markdown. Use `blocks` unless you specifically want the legacy Markdown `richtext` editor. (They are two distinct field types, not one field with a flag.)
- `email`, `password`, `uid` (slug), `enumeration`
- `integer`, `biginteger`, `float`, `decimal`, `boolean`
- `date`, `time`, `datetime`, `timestamp`
- `json` — escape hatch for arbitrary structures
- `media` — single or multiple, optionally restricted to images/videos/audio/files
- `relation` — `oneToOne`, `oneToMany`, `manyToOne`, `manyToMany`. In v5 these use **document IDs**, not numeric IDs.
- `component` — embed a component (single or repeatable)
- `dynamiczone` — list of allowed component types

## Document IDs (v5 change from v4)

Strapi v5 introduced `documentId` (a stable string) as the public identifier; the internal numeric `id` still exists but should not be exposed. **All API URLs use `documentId`**: `/api/articles/<documentId>`, not `/api/articles/<id>`. Mention this explicitly in stage 5 if the user is migrating from v4.

## Draft & publish

- Off by default. Turn it on per content type if editors need to stage changes.
- When on, queries default to **published** entries. To fetch drafts, pass `status: 'draft'` (or use the admin/preview flow).
- Components and dynamic-zone children inherit their parent's published status — you don't toggle draft/publish on components.

## i18n (Internationalization)

- Per-content-type and per-field. Turn on `localized: true` only on the fields that actually translate (title, body) — leave structural fields (slug, relations, media references) shared unless the design genuinely diverges per locale.
- Default locale is `en`; configure others under Settings → Internationalization.
- Frontend fetches: `?locale=en` (or `?locale=all`).

## Default population strategy (don't pass `populate=*` everywhere)

Strapi's REST `populate` defaults to *not* including relations/components/media. Two ways to fix that:

1. **Per-request `populate`** — works but litters every frontend call with deep populate trees.
2. **Route middleware** (recommended) — define a middleware in `src/middlewares/` that sets `ctx.query.populate` for the route. Apply it in the route file (`src/api/<api>/routes/<api>.ts`) so every call to that endpoint comes back fully populated.

Example shape (verify against current docs before pasting):

```ts
// src/middlewares/populate-article.ts
export default () => async (ctx, next) => {
  ctx.query.populate = { cover: true, author: true, blocks: { populate: '*' } }
  await next()
}
```

```ts
// src/api/article/routes/article.ts (custom route file)
export default {
  routes: [
    { method: 'GET', path: '/articles', handler: 'article.find',
      config: { middlewares: ['api::article.populate-article'] } },
    // ...
  ],
}
```

This keeps the frontend dumb — it just calls `GET /api/articles` and gets the populated tree.

## Permissions checklist (per content type)

Configure under Settings → Users & Permissions → Roles → Public / Authenticated:

- `find`, `findOne` — typically `Public: yes` for editorial content
- `create`, `update`, `delete` — usually off for `Public`, on for `Authenticated` only when end-users own the content
- `Custom routes` — explicitly allow each one per role

Map these to the stage-5 spec under "Permissions & roles" so the build session doesn't have to guess.

## Components vs. relations — which to choose?

- **Component** if the embedded data has no independent life (an SEO block belongs to its parent and dies with it).
- **Relation** if the data is independently editable, queryable, or shared across many parents (an `Author` is a relation, not a component, because the same author appears on many articles).

## Where to dig deeper

- v5 docs root: https://docs.strapi.io
- Content-type Builder: https://docs.strapi.io/cms/features/content-type-builder
- Populate & filtering: https://docs.strapi.io/cms/api/rest/populate-select
- Document Service API: https://docs.strapi.io/cms/api/document-service
- Lifecycles: https://docs.strapi.io/cms/backend-customization/models#lifecycle-hooks
- i18n: https://docs.strapi.io/cms/features/internationalization

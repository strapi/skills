# Examples

Drop filled-in example outputs here from real or sample products run through the skill. Examples help future invocations see what "good" looks like at each stage — they are illustrative, never copied verbatim.

## Worked example: `trailhead/`

A complete six-stage run for **Trailhead**, a community trail-conditions app. It exercises the non-default branches deliberately: **Next.js** frontend (not the TanStack Start default) and the **Better Auth (beta)** path (so it shows U&P-removed permissions via `plugin-api-permissions`, the `generateId: 'serial'` requirement, and cross-site-cookie handling). It also shows editorial vs user-generated content (Trails vs Reports), components, draft&publish, an `is-owner` policy, and the corrected `create-strapi-app` flags. Read it end-to-end to see how stage-4 choices propagate into the stage-5 spec and the stage-6 build plan.

## Suggested layout

```
examples/
├── <product-name>/
│   ├── 01-product.md
│   ├── 02-users.md
│   ├── 03-requirements.md
│   ├── 04-tech-decisions.md
│   ├── 05-tech-requirements.md
│   └── 06-claude-code-spec.md
└── README.md (this file)
```

## What makes a good example

- A real or convincingly-real product idea, end-to-end through all six stages
- Concrete content types, components, and dynamic zones — not placeholders
- A sample Strapi schema in stage 5 that compiles
- A stage-6 spec that another Claude session could actually act on without follow-up questions

## Anti-patterns to avoid in examples

- Copy-pasting the templates with `[fill in]` left blank
- Picking a stack that violates the skill's defaults without explaining why (defeats the purpose of an example)
- Examples so abstract they don't show how to handle real edge cases (auth provider quirks, Strapi Cloud env var setup, dynamic zone modeling)

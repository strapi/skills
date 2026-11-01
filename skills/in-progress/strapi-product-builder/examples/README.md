# Examples

Drop filled-in example outputs here from real or sample products run through the skill. Examples help future invocations see what "good" looks like at each stage — they are illustrative, never copied verbatim.

## Worked example: `trailhead/`

A complete six-stage run for **Trailhead**, a community trail-conditions app. It deliberately exercises the **Better Auth (beta, opt-in)** path rather than the stock U&P default (so it shows U&P-removed permissions via `plugin-api-permissions` and the `generateId: 'serial'` requirement), with a **Next.js** frontend. It also shows editorial vs user-generated content (Trails vs Reports), components, draft&publish, and an `is-owner` policy. Read it end-to-end to see how stage-4 choices propagate into the stage-5 spec and the stage-6 build plan.

> **It predates some current rules.** A fresh-eyes review of all six files (October 2026) found that its `06-build-spec.md` says "See stage 5" instead of inlining the schemas, describes permissions without seeding them in code, leaves the cross-site session topology undecided, and has no Operations (robustness sweep) section in `05`. Its reason for choosing Better Auth (Google sign-in and a cleaner session model) also predates the rule that 04 must say what Users & Permissions lacks — U&P supports Google too. Use it for the shape of a run, not as a model for those parts, until it's regenerated with the current skill.

## Suggested layout

```
examples/
├── <product-name>/
│   ├── 01-product.md
│   ├── 02-users.md
│   ├── 03-requirements.md
│   ├── 04-tech-decisions.md
│   ├── 05-tech-requirements.md
│   └── 06-build-spec.md
└── README.md (this file)
```

## What makes a good example

- A real or convincingly-real product idea, end-to-end through all six stages
- Concrete content types, components, and dynamic zones — not placeholders
- A sample Strapi schema in stage 5 that compiles
- A stage-6 spec that any coding-agent session could actually act on without follow-up questions

## Anti-patterns to avoid in examples

- Copy-pasting the templates with `[fill in]` left blank
- Picking a stack that violates the skill's defaults without explaining why (defeats the purpose of an example)
- Examples so abstract they don't show how to handle real edge cases (auth provider quirks, Strapi Cloud env var setup, dynamic zone modeling)

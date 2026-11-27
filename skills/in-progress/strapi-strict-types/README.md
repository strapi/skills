# strapi-strict-types

> ⚠️ **Beta feature, in-progress skill.** Strict types (`strictTypes: true` in `config/typescript.ts`) are beta and off by default. This skill lives in `skills/in-progress/`: it is not yet reviewed for production use and changes with the feature. Feedback welcome in the [strict types GitHub discussion](https://github.com/strapi/strapi/discussions/27747).

An agent skill that turns on Strapi's strict types in a TypeScript project and fixes the resulting type errors: typed service and config lookups, application contracts, typed route configs, permission action IDs, and licensed features.

- `SKILL.md`: the workflow (detect, enable, triage, patterns, verify).
- `reference.md`: error catalogue, generated files, licensed feature names, known limits, experimental-build install notes.

Strict types ship with [strapi/strapi#28147](https://github.com/strapi/strapi/pull/28147). The user docs the skill follows are drafted in [strapi/documentation#3726](https://github.com/strapi/documentation/pull/3726).

Install like any other skill of this repo (see the root [README](../../../README.md)), using the path `skills/in-progress/strapi-strict-types`.

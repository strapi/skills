# Scripts

Optional helper scripts for the skill. None are required — the skill works without anything here. Add scripts when a step is repetitive enough to be worth automating.

## Ideas for future scripts

- `scaffold-output-folder.sh` — create the six empty `.md` files from `templates/` in a target folder, ready to be filled in. Useful when running the skill in Claude Code.
- `validate-spec.ts` — sanity-check a finished `06-claude-code-spec.md`: every content type referenced in the route tree exists, every env var is documented, every milestone has a "done when".
- `to-strapi-schema.ts` — convert a stage-5 content-type table into Strapi v5 content-type `schema.json` files directly.
- `bundle-as-zip.sh` — bundle the six output files into a zip for download (useful in claude.ai web / Desktop artifact mode).

## Conventions

- Scripts must be runnable without network access where reasonable.
- Document required env / args at the top of each script.
- Don't add scripts that hard-code paths — accept them as args.
- Surface compatibility: prefer Node/TypeScript scripts over bash where the script logic is non-trivial, since Node runs on every Claude surface that has Bash.

# Functional Requirements

## Core features (MVP)
- [Capability statement]
- [Capability statement]

## Value metrics (only if the value depends on one)
- [Term, e.g. "fresh"]: [plain-words definition — what counts, over what time window]

## Account & auth
- End-user accounts: yes/no — [why]
- Editorial admin accounts: yes/no — [who edits content]
- Roles needed: [Public, Authenticated, custom roles]
- Account system per role: [role] → Strapi admin account (team, `/admin`) | end-user account (API)

## Content the product manages

### Editorial content (managed in Strapi admin)
- [Entity]: [what it represents]

### User-generated content (created via API)
- [Entity]: [what it represents]

### Where the first content comes from
- [Entity]: [created by the team | imported from <source> (licence: …) | user-generated]
- When a user wants something that isn't listed: [what they do]

### Removing bad content (if users create content)
- Who can hide or remove it: ... · How users report it: ... · How fast: ...

### Reusable shapes (likely Strapi components)
- [shape]: [where it appears]

### Flexible layouts (likely Strapi dynamic zones)
- [zone]: [what content types use it, what blocks it accepts]

## Localization & drafts
- Multi-language (Strapi i18n): yes/no — [locales if yes]
- Draft & publish: yes/no — [which content types]

## Integrations
- [Capability]: [what the product needs from a third party]

## AI / agent access (MCP)
- AI agent / assistant reads or writes content: yes/no — [which content types; read and/or write]
- If yes → candidate for Strapi's built-in MCP server (GA since v5.49); the enable/disable decision is made in stage 4

## Non-functional requirements
- Performance: ...
- Scale: ...
- Security: ...
- Compliance: ...

## Out of scope for MVP
- [Thing] — defer to v2

---
name: strapi-product-builder
description: Run a structured, business-value-first product-planning interview that turns a fuzzy idea into a build-ready spec — BEFORE any code is written. Use this the moment someone is still figuring out WHAT to build and says things like "I have an idea for an app, help me think it through", "help me plan/scope/design my product", "where do I start?", "let's spec this out before I write code", or "turn this into a PRD". Covers any new app, site, SaaS, MVP, marketplace, or feature. Trigger on the planning intent alone — the user need NOT mention Strapi, a CMS, or any tech; a Strapi v5 + Strapi Cloud backend (overridable, with your choice of frontend and auth) is assumed by default. It nails value, users, and requirements before any tech decision, then produces six markdown files ending in a Claude Code build spec. Do NOT use once a spec or project exists and the user wants to scaffold, configure, migrate, add pages, wire auth, or debug — those are build tasks, not idea-stage planning.
---

# Strapi Product Builder

A structured, interview-driven process that turns a product idea into a build-ready spec for a **Strapi-backed project**. The output is six markdown files in a project folder — the last one is detailed enough that Claude Code can start building the POC immediately, with Strapi content types, API routes, and seed data scaffolded.

## Core philosophy

**Business value drives the product. The product drives the requirements. The requirements drive the tech.**

Never let tech choices come first. A user excited about "I want to use Next.js and Supabase" hasn't yet decided what they're building or why anyone would use it. Gently steer back to value and users before any framework conversation.

If the user tries to jump straight into tech ("what stack should I use for my idea?"), acknowledge the question and explain that you'll get there in stage 4 — but first you need to understand the product, the user, and the requirements so the tech recommendation actually fits. Then start at stage 1.

This skill assumes the **backend / CMS will be Strapi v5** by default. The frontend, hosting, and ancillary services are still open questions for stage 4. If a user has a hard requirement that rules Strapi out (e.g., they need a fully serverless/edge-only architecture, or are committed to a different headless CMS), surface that early and either adapt or recommend they use a more general product-design skill instead.

## Working with Strapi documentation

Before recommending Strapi APIs, plugin patterns, content-type configuration, or migration steps, **ground your answer in current docs** — Strapi's APIs and conventions evolve.

**Order of preference**:

1. **Strapi Docs MCP** — if an MCP server named `strapi-docs` (or similar, e.g. `mcp__strapi-docs__*`) is connected, prefer it for any factual lookup. Use it whenever the user asks "how do I do X in Strapi" or you're about to write code that touches Strapi internals (lifecycles, controllers, services, policies, middlewares, plugin SDK, content-type schemas, the Document Service API, etc.).
2. **Official documentation** — fall back to https://docs.strapi.io (v5 is the current major version). Use `WebFetch` to pull the specific page when an MCP isn't available.
3. **Companion skills** — for common Strapi build tasks, prefer an existing companion skill over reinventing — **but companions are optional accelerators, never requirements.** The current set (capability, status, surface constraints, and a per-capability fallback for when the skill is absent) is the **`references/companions.md`** registry — the single source of truth. Two rules govern their use: reason **capability-first** (not by skill name), and **discover before invoking** (only call a companion actually present this session; otherwise emit its fallback into the spec). Any companion names mentioned in stages 4–6 below are **illustrative** — the registry + the availability check are what govern. Most users have none of these installed, so the stage-6 spec must always stand on its own.

**When to cite the docs in the output files**: whenever stage 5 or 6 references a non-obvious Strapi feature (lifecycles, components vs. dynamic zones, draft & publish, i18n, RBAC, custom fields, document service queries), include a link to the relevant docs page so the future Claude Code build session can verify the API surface before generating code. Curated, capability-tagged sources (official docs, Strapi blog tutorials, reference repos) live in **`references/resources.md`** — cite the matching entry, and re-verify any blog tutorial's exact commands/versions against current docs first (tutorials drift).

If neither the MCP nor docs are reachable for a specific question, say so explicitly in the file ("Verify against docs.strapi.io before implementing") rather than guessing.

## Skill folder structure

This skill lives as a folder, not a single file. Add new context (opinions, code references, scripts, examples) to the appropriate subfolder rather than bloating `SKILL.md`. `SKILL.md` should remain the entry point — short enough to load fully, with pointers into the subfolders.

```
strapi-product-builder/
├── SKILL.md                    # this file — entry point, instructions, stage flow
├── references/                 # opinions, defaults, deeper guidance Claude reads on demand
│   ├── strapi-defaults.md      # the opinionated default stack and why
│   ├── strapi-cloud-deploy.md  # step-by-step Strapi Cloud deployment
│   ├── content-modeling.md     # collection vs single vs component vs dynamic zone, populate strategy
│   ├── frontend-frameworks.md  # the four first-class frontends + how to parameterize stages 5-6
│   ├── auth-better-auth.md     # plugin install + config + frontend wiring (beta — confirm first)
│   ├── docs-lookup.md          # how to use the strapi-docs MCP and docs.strapi.io
│   ├── companions.md           # registry of companion skills (capability, status, fallback) + promotion checklist
│   ├── resources.md            # curated external refs (docs, Strapi blog tutorials, repos), capability-tagged
│   └── strapi-mcp-server.md    # built-in Strapi MCP server (v5.47+, beta) — optional product capability
├── templates/                  # one .md per stage — the file templates the skill writes
│   ├── 01-product.template.md
│   ├── 02-users.template.md
│   ├── 03-requirements.template.md
│   ├── 04-tech-decisions.template.md
│   ├── 05-tech-requirements.template.md
│   └── 06-claude-code-spec.template.md
├── examples/                   # filled-in example outputs from real or sample products
│   └── README.md
└── scripts/                    # optional helpers (e.g., scaffold the six output files)
    └── README.md
```

**Conventions**:
- **Read `references/*` on demand**, not eagerly. When a stage touches a topic covered by a reference (e.g., stage 5 needs population strategy), open `references/content-modeling.md` then.
- **Templates are the source of truth** for what each stage's file looks like. The inline templates in `SKILL.md` are summaries; if they conflict with `templates/`, prefer `templates/`.
- **Examples are illustrative**, never copied verbatim.
- **Add a new opinion?** Drop it in `references/` and link it from the relevant stage section in `SKILL.md`. Keep `SKILL.md` skimmable.

## How to run the skill

This is a **heavily interview-driven** skill. You ask focused questions one stage at a time, wait for answers, draft the stage's markdown file, get the user's confirmation, and only then move to the next stage. The user can jump back to revise any earlier stage at any time — when they do, ask whether downstream stages need to be updated to stay consistent.

At the start, ask the user for the product name (or a working name).

## Surface adaptability — Claude Code, Claude Desktop, claude.ai web

This skill is designed to run in **any** Claude surface. Detect what's available and adapt the output mechanism — never assume a specific environment.

**Pick the output mode at the start of stage 1, before you create any files:**

| Surface | Detection signal | Output mode |
|---|---|---|
| **Claude Code** | `Write`/`Edit`/`Bash` tools available | Create a real folder at `<cwd>/<product-name-kebab-case>/` (or ask user where) and write the six `.md` files there. You can also invoke companion skills (`strapi-configuration`, `add-page`, `dockerize-strapi`). |
| **Claude Desktop** with filesystem MCP | A filesystem MCP server is connected (e.g., `mcp__filesystem__*`) | Write files via the MCP into a user-chosen folder. Ask the user to confirm the path the first time. |
| **Claude Desktop** without filesystem MCP, or **claude.ai web** | Only `artifacts` / `present_files` / inline display | Produce each stage's content as an **artifact** (`text/markdown`) the user can open, edit, copy, or download. Tell the user how to save them locally. Six artifacts total — one per stage. |

**Stage-6 spec rendering** — regardless of surface, the final `06-claude-code-spec.md` should be self-contained enough that the user can paste it into a fresh Claude Code session and start building. If the user is *already* in Claude Code, offer to invoke `strapi-configuration` directly after stage 6 instead of just emitting the spec.

**Companion skills** (registry: `references/companions.md`) only run inside **Claude Code**, and only when actually installed. In Desktop/web — and for any user who doesn't have a given skill — reference the capability in the build spec (with its fallback) for the user's future Claude Code session, but don't try to invoke the skill. (`add-page` is Astro-specific — only reference it when the user chose Astro in stage 4.)

**Strapi docs lookup** works on all surfaces:
- `strapi-docs` MCP if connected (Desktop + Code both support MCP)
- `WebFetch` against https://docs.strapi.io otherwise (works in Code; Desktop/web can use the analogous fetch tool or web_search)

**Tone**: don't expose this branching to the user as a configuration step — just pick the right mode and proceed. Only ask if you genuinely can't tell (e.g., "I can either write these as files in the current folder or render them as artifacts you can copy — which do you prefer?").

## The six stages

Each stage has a fixed filename in the project folder. Run them in order by default, but the user can revisit any stage.

| # | Filename | Purpose |
|---|---|---|
| 1 | `01-product.md` | What the product is and the value it delivers |
| 2 | `02-users.md` | Who uses it, how they use it, what outcome they get |
| 3 | `03-requirements.md` | Functional requirements derived from stages 1 & 2 |
| 4 | `04-tech-decisions.md` | Tech stack discussion, driven by requirements |
| 5 | `05-tech-requirements.md` | Detailed technical spec — data models, APIs, components |
| 6 | `06-claude-code-spec.md` | Build-ready markdown that Claude Code can act on |

After each stage, write or render the file (using the output mode chosen above), show the user a summary of what you captured, and ask: *"Does this look right? Anything to revise before we move to stage [next]?"*

When the user confirms, surface the file to them — the way that works on the current surface:
- **Claude Code / filesystem MCP**: just tell them the path; they can open it.
- **Artifacts mode**: the artifact is already visible to them inline.
- If `present_files` is available, you can use it.

Then start the next stage.

---

## Stage 1 — What is the product?

**Goal**: Define the product and its value clearly enough that anyone reading `01-product.md` immediately understands what it is and why it matters.

**Do not discuss tech in this stage.** If the user brings up frameworks or hosting, note it for stage 4 and steer back.

**Interview questions to ask** (don't ask them all at once — ask 2-3, wait, follow up):

- In one sentence, what is this product?
- What problem does it solve? Whose problem?
- What does the customer (or user) get out of it that they can't get today?
- What's the "before and after" — what does someone's life/work look like before using this vs. after?
- Is this a tool, a service, a marketplace, a platform, a content product? (Helps frame the value.)
- What would success look like a year in? (Not metrics — a picture.)

**File template**: write `01-product.md` from `templates/01-product.template.md` (the source of truth). Sections: One-liner · The problem · The value · Product category · What success looks like.

---

## Stage 2 — How will users use it?

**Goal**: Capture the human side — who the users are, what they're trying to accomplish (jobs-to-be-done), the journey they take through the product, and the core repeated action (the "loop").

**Still no tech discussion.** This stage is about humans and outcomes.

Capture all three layers: **personas, journeys, jobs-to-be-done, and the core loop.** Ask questions to fill out each:

**Personas** (1-3 is plenty for an MVP):
- Who are the primary users? Give each a name, a role, a context.
- What do they currently do instead of using your product?
- What's their level of technical sophistication?

**Jobs-to-be-done** (per persona):
- What is each persona "hiring" the product to do for them?
- When in their day/week does this job come up?

**Primary user journey**:
- Walk through what happens from the moment a user discovers the product to the moment they get value. Ask the user to narrate it.
- What's the first thing they do? The second? The "aha" moment?

**Core loop** (the repeated action that keeps users coming back):
- What action does a user do over and over? (E.g., for Twitter: post, scroll, react. For a habit tracker: check in daily.)
- What pulls them back the next day?

**File template**: write `02-users.md` from `templates/02-users.template.md`. Sections: Personas · Jobs-to-be-done · Primary user journey · Core loop.

---

## Stage 3 — Functional requirements

**Goal**: Translate the product and user understanding into concrete requirements. What does the product need to *do*?

**Still no tech.** Requirements are capability statements, not implementation choices. "The system must let users invite teammates by email" is a requirement. "Use SendGrid for email" is a tech decision (stage 4).

Drive the requirements directly from stages 1 and 2. For each item in the user journey and core loop, ask: what must the product do to enable this?

**Categories to cover**:

- **Core features** — what the product must do for the primary loop to work
- **Account/auth** — sign-up, sign-in, identity (capability level: "users must be able to sign in", not "use OAuth"). Note: Strapi has built-in Users & Permissions for end-users plus a separate Admin auth — flag here whether the product needs end-user accounts, admin-only content editing, or both
- **Content the product manages** — at a conceptual level (e.g., "articles", "products", "team members"). Distinguish *editorial content* (managed by admins in Strapi's CMS) from *user-generated content* (created via the Strapi REST/GraphQL API by end users). Do not write schemas yet
- **Reusable content patterns** — note when the same shape repeats across entities (hero sections, SEO blocks, address) — these become Strapi *components*. Note when one slot needs to hold multiple shapes (page builder, flexible layout) — these become *dynamic zones*. Still capability-level only
- **Localization & drafts** — does the product need multi-language content (Strapi i18n) or a draft/publish workflow? Capture as a yes/no requirement here
- **Integrations needed** — third-party services the product must talk to (named at the capability level: "send email", "process payments")
- **AI / agent access (MCP)** — does the product need AI agents or AI-powered features to read/write its content (assistants, copilots, content automation)? Strapi v5.47+ ships a built-in **MCP server** for exactly this. Capture as a yes/no capability here; the tech decision lands in stage 4. See `references/strapi-mcp-server.md`
- **Non-functional requirements** — performance expectations, scale assumptions, security needs, compliance (GDPR, HIPAA, etc.)
- **Out of scope (for MVP)** — explicit list of what the v1 will NOT do, to prevent scope creep

**Interview questions**:
- For the MVP, what's the minimum the product must do for a user to get value?
- What can wait until v2?
- Are there compliance or regulatory needs (data residency, healthcare, finance)?
- How many users do you expect in the first 6 months? First year?

**File template**: write `03-requirements.md` from `templates/03-requirements.template.md` (the fuller version — it splits editorial vs user-generated content and flags reusable shapes/dynamic zones and i18n/draft-publish). Sections: Core features · Account & auth · Content the product manages · Localization & drafts · Integrations · Non-functional requirements · Out of scope.

---

## Stage 4 — Tech decisions

**Goal**: Choose the tech stack. **Now** is when tech enters the conversation — and it's chosen to fit the requirements, not the other way around.

**Defaults this skill is opinionated about** (the user can override any of them, but state them up front):

| Area | Default | Rationale |
|---|---|---|
| Backend / CMS | **Strapi v5** | Headless CMS with admin UI, REST + GraphQL out of the box, content types map cleanly from stage 3 |
| Database | **PostgreSQL** | Strapi's recommended production DB; works on Strapi Cloud and most hosts |
| Hosting (backend) | **Strapi Cloud** | Managed Strapi: zero infra, automated upgrades, built-in CDN/media, Postgres included. See `references/strapi-cloud-deploy.md` |
| API style | **Strapi REST** with route middlewares for population (GraphQL plugin if the frontend needs it) | Matches Strapi's defaults; companion skills assume REST |
| Frontend | **User's choice — always ask** (first-class: Next.js, TanStack Start, Astro, Vue/Nuxt) | Strapi is headless; any frontend works. No silent default. See `references/frontend-frameworks.md` |
| Auth | **strapi-community/plugin-better-auth** ⚠️ *beta — confirm first* | Brings Better Auth into Strapi — modern session/social/2FA. **Maintainers say beta, not for production**; needs Strapi ≥ 5.45 and removes Users & Permissions. Confirm in stage 4; else use stock U&P. See `references/auth-better-auth.md` |

**Process**:

1. State the defaults above and ask: *"Backend will be Strapi v5 deployed to Strapi Cloud unless you have a reason to choose otherwise. For the frontend — I support Next.js, TanStack Start, Astro, or Vue/Nuxt well (or another framework you prefer). Anything you already have in mind?"*
2. **Frontend — always ask, never assume.** There is no silent default. Once chosen, that choice parameterizes stages 5-6 (scaffold command, route tree, env-var prefix, auth wiring) per `references/frontend-frameworks.md`.
3. **Auth — confirm before defaulting to Better Auth.** The better-auth plugin is the preferred default *but it is beta and not recommended for production by its maintainers*, requires Strapi ≥ 5.45, and removes Users & Permissions. Say this plainly and ask: *"For auth I'd suggest the Better Auth plugin — it's modern (social, 2FA, passkeys) but currently beta, so not ideal if you're launching to production soon. The conservative choice is Strapi's built-in Users & Permissions. Which fits?"* Record the choice and its implications (the permissions model differs — see below).
4. Listen to preferences. If they push back on Strapi Cloud (cost, region, on-prem requirement), capture it and move to a self-hosted Strapi option (and invoke the `dockerize-strapi` skill in stage 6).
5. For each area below, either confirm their choice (with a brief sanity-check against the requirements) or suggest options if they're undecided. When suggesting, give 2-3 options with tradeoffs — don't just hand down a winner.
6. For each decision, capture the **why** — what requirement or preference drove the choice.

**Areas to cover**:

- **Backend / CMS** — default Strapi v5. Note Strapi version, Node version target, and whether any plugins are anticipated (i18n, Users & Permissions, GraphQL, custom fields)
- **Database** — default Postgres on Strapi Cloud. SQLite is fine for local dev only
- **Hosting — backend** — default Strapi Cloud. Alternatives: Render, Railway, Fly.io, AWS, self-hosted Docker
- **Hosting — frontend** — Vercel, Netlify, Cloudflare Pages, etc. (all four first-class frameworks deploy to any of these)
- **Frontend framework** — no default; ask. First-class: **Next.js** (broad ecosystem, app-style products), **TanStack Start** (type-safe full-stack React), **Astro** (content-heavy/static sites), **Vue/Nuxt** (Vue teams). Others (SvelteKit, SolidStart, Remix, plain React) supported too. See `references/frontend-frameworks.md`
- **Auth** — preferred default is the **better-auth plugin** (*beta — confirm first*, needs Strapi ≥ 5.45, removes U&P; brings social/2FA/passkeys). Conservative/production default is Strapi's built-in **Users & Permissions** for end-users + Strapi admin auth for editors. External providers (Clerk, Auth0) only if SSO/enterprise needs justify. See `references/auth-better-auth.md`
- **Media / file storage** — Strapi Cloud bundles media + CDN by default. For self-hosted: S3, R2, Cloudinary via the upload provider
- **CI/CD** — GitHub Actions for the frontend; Strapi Cloud has built-in deploy-on-push
- **Email / notifications** — Strapi email provider (Sendmail, SendGrid, Mailgun, Resend)
- **Payments** — Stripe / Lemon Squeezy / Paddle if applicable, called from custom Strapi controllers or the frontend
- **Analytics & monitoring** — PostHog, Plausible, Sentry
- **MCP server (AI agent access)** — **off by default.** If stage 3 flagged AI/agent content access, enable Strapi's built-in MCP server (v5.47+, **beta**): `mcp.enabled` in `config/server`, exposed at `POST /mcp`, authed with a scoped Admin API token. Extend with custom tools via a plugin (`strapi.ai.mcp`). Don't enable speculatively. See `references/strapi-mcp-server.md`
- **Styling** — Tailwind by default

If a requirement from stage 3 makes a choice questionable (e.g., user needs offline-first sync, which Strapi doesn't natively do), flag it gently and discuss tradeoffs. Use the strapi-docs MCP or `WebFetch` against https://docs.strapi.io to verify capability claims before recommending against Strapi.

**File template**: write `04-tech-decisions.md` from `templates/04-tech-decisions.template.md`. For each decision capture **Choice · Considered · Why**. Record the frontend framework explicitly (it drives stages 5-6) and the auth choice with its implications (Better Auth → beta + removes U&P + needs api-permissions; or stock U&P → Public/Authenticated roles).

---

## Stage 5 — Tech requirements (detailed spec)

**Goal**: Translate the requirements (stage 3) and tech decisions (stage 4) into concrete technical artifacts: **Strapi content types**, REST/GraphQL endpoints, custom controllers, and frontend routes.

This is the engineering blueprint. It's still readable by humans but it's where the abstract "users can sign in" becomes a Better Auth-protected route and a `User` collection in Strapi.

**Ask the user**:
- For content: do you want me to draft the Strapi schemas (collection types, single types, components, dynamic zones) from the entities we identified, then you review?
- For APIs: are Strapi's auto-generated REST endpoints enough, or do we need custom controllers (e.g., aggregations, third-party calls, webhooks)? Do we need GraphQL?
- For frontend: using the framework chosen in stage 4 (see `references/frontend-frameworks.md`), what's the route/page tree? Use that framework's convention — `app/` (Next.js), `src/routes/` (TanStack Start), `src/pages/` (Astro), `pages/` (Nuxt).

When you're unsure how a Strapi feature works (lifecycle hooks, dynamic zone querying, the Document Service vs. Entity Service, populate syntax in v5), **look it up via the strapi-docs MCP first**, otherwise `WebFetch` https://docs.strapi.io. Cite the specific page in the file.

**Sections to produce**:

- **Strapi content types** — for each entity from stage 3:
  - Kind: collection type, single type, or component (and which category)
  - Fields with Strapi field types (`string`, `text`, `blocks` (the modern rich-text editor — its own type), `richtext` (legacy Markdown), `media`, `relation`, `enumeration`, `json`, `uid`, `datetime`, `boolean`, `integer`, `decimal`, `email`, `password`, `component`, `dynamiczone`)
  - Relations with target + cardinality (`oneToOne`, `oneToMany`, `manyToOne`, `manyToMany`)
  - Draft & publish: yes/no
  - Localized: yes/no (per field if needed)
  - Validations / unique constraints
- **Strapi components** — reusable shapes used by multiple content types or inside dynamic zones (e.g., `shared.seo`, `shared.cta`, `blocks.hero`)
- **Strapi dynamic zones** — slots that accept a list of components (typical for page builders)
- **API surface**:
  - Auto-generated Strapi REST endpoints we will use (and any we will *disable* via permissions)
  - Default population strategy — describe via route middleware (see https://docs.strapi.io/cms/api/rest/populate-select), not query params on every call
  - Custom controllers / routes — list with method, path, auth (better-auth session required vs. public), request/response shape, description
  - GraphQL — only if installed. List queries/mutations the frontend depends on
- **MCP server** — *only if enabled in stage 4.* Note `mcp.enabled` in `config/server`, which content types/actions are exposed, the scoped Admin API token strategy (least-privilege per use case), any custom tools added via a plugin (`strapi.ai.mcp`), and the beta caveats (no media upload, dynamic zones untyped, stateless `POST /mcp` only). See `references/strapi-mcp-server.md`
- **Auth flows (Better Auth)** — sign-up, sign-in, sign-out, password reset, social providers (which ones), session storage, and how the frontend gets the session. Reference https://github.com/strapi-community/plugin-better-auth and https://better-auth.com
- **Permissions & roles** — *depends on the stage-4 auth choice.* **Stock Users & Permissions**: roles (Public, Authenticated, custom) and what each can read/write per content type. **Better Auth path**: content-API permissions are governed by `@strapi-community/plugin-api-permissions` instead (U&P is removed) — describe permissions in those terms. Admin roles for the editorial side either way. See `references/auth-better-auth.md`
- **Lifecycles / policies / middlewares** — any logic that fires on create/update/delete (e.g., slug generation, cache invalidation, sending email)
- **Pages & key components (frontend)** — the route/page tree in the **chosen framework's** convention (`app/`, `src/routes/`, `src/pages/`, or `pages/`). For each route: where it fetches Strapi data (loader/Server Component/`useFetch`/frontmatter), components, and any client interactivity. See `references/frontend-frameworks.md`
- **State management** — server state via the framework's data layer (loaders / Server Components / `useFetch`) plus TanStack Query for client refetches where needed; URL state for filters; minimal client state
- **Background jobs / scheduled tasks** — Strapi cron tasks (`config/cron-tasks.ts`, with `cron.enabled` in `config/server`) or external (e.g., Strapi Cloud doesn't expose long-running workers — flag if needed)
- **Media & uploads** — Strapi Cloud media (default) or external provider; image formats and responsive variants
- **Environment variables / secrets** — separate lists for the Strapi backend and the frontend. Use the chosen framework's **public** prefix for browser-safe values (`NEXT_PUBLIC_`/`VITE_`/`PUBLIC_`/`NUXT_PUBLIC_`) and **no public prefix** for server-only secrets (e.g. a Strapi API token used in SSR fetches must NOT be public-prefixed or it leaks to the client bundle)

**File template**: write `05-tech-requirements.md` from `templates/05-tech-requirements.template.md` (the source of truth). It covers: content types (with field tables), components, dynamic zones, API surface (REST/population/custom routes/GraphQL), auth flows, permissions & roles, lifecycles/policies/middlewares, the frontend route tree, state management, background jobs, media, and env vars. Adapt the auth and frontend sections to the stage-4 choices (see `references/auth-better-auth.md` and `references/frontend-frameworks.md`) — don't assume Better Auth or TanStack Start if the user chose otherwise.

---

## Stage 6 — Claude Code build spec

**Goal**: Produce a single markdown file (`06-claude-code-spec.md`) that Claude Code can read and immediately start building a Strapi v5 POC with the **frontend chosen in stage 4**. This file is the synthesis of stages 1-5, reformatted for an AI coding agent.

This file should be **self-contained** — Claude Code shouldn't need to read the other five files to know what to build. Reference them as background, but include everything Claude Code needs to act.

**Up-front instructions to bake into the spec for the build session**:
- Use the **strapi-docs MCP** (if installed) for any Strapi API question; otherwise `WebFetch` https://docs.strapi.io.
- Invoke the companion skill **`strapi-configuration`** to scaffold the Strapi project and content types from this spec rather than hand-rolling.
- If the Better Auth path was chosen, use the **`better-auth-setup`** companion skill for the auth install/config (it handles the three plugins, removes U&P, and the zod peer-dep fix).
- Use **`add-page`** only when the frontend is **Astro** and you're adding a new content-type-backed page after the initial scaffold (it generates Astro pages — not for Next.js/TanStack/Vue).
- Use **`dockerize-strapi`** only if the user opted out of Strapi Cloud in stage 4.

**Required sections**:

1. **Project overview** — 2-3 sentence summary from stage 1, plus the one-liner
2. **Stack** — confirmed choices from stage 4 (Strapi v5, Postgres, Strapi Cloud, the **chosen frontend framework**, the **chosen auth approach**, plus the rest)
3. **Repo layout** — typical: monorepo or two folders (`apps/cms` Strapi + `apps/web` frontend), or two separate repos
4. **Setup commands** — concrete commands for both the backend and frontend. Use the **chosen framework's** scaffold command (see `references/frontend-frameworks.md`)
5. **Build order (milestones)** — discrete chunks Claude Code can tackle one at a time. Each milestone has a clear "done when…" criterion. Default milestone shape:
   - **M1 — Strapi scaffold + Postgres + Strapi Cloud project linked** (use `strapi-configuration` skill)
   - **M2 — Content types, components, dynamic zones, draft/publish, i18n, permissions** (use `strapi-configuration`)
   - **M3 — Auth**: Better Auth path → use `better-auth-setup` (installs the 3 plugins, removes U&P, configures providers); or stock U&P path → configure Public/Authenticated roles
   - **M4 — Custom controllers, lifecycles, route middlewares (default population)**
   - **M5 — Frontend scaffold + routes/pages + data fetching calling Strapi** (chosen framework)
   - **M6 — Auth UI wired to the auth client; protected routes work**
   - **M7 — Seed data + media uploads**
   - **M8 — Strapi Cloud deploy + frontend deploy + smoke test of core loop**
6. **Strapi schemas** — copied from stage 5, formatted as Strapi v5 schema JSON (or as instructions to the `strapi-configuration` skill)
7. **API surface** — copied from stage 5: enabled REST endpoints, default population middlewares, custom routes/controllers, GraphQL (if any)
8. **Auth** — install steps, config, providers, frontend client wiring for the chosen approach (Better Auth or U&P)
9. **Frontend route/page tree** — file paths in the chosen framework's convention (`app/`, `src/routes/`, `src/pages/`, or `pages/`), data fetching, components
10. **Environment variables** — full list (backend + frontend), with descriptions and example values (never real secrets). Use the framework's public prefix only for browser-safe values; keep secrets unprefixed
11. **Deployment**:
    - **Strapi backend → Strapi Cloud** (default). Steps: create project at https://cloud.strapi.io, link the Git repo, set env vars, set Node version, push to deploy. Reference: `references/strapi-cloud-deploy.md` and https://docs.strapi.io/cloud/getting-started/intro
    - **Frontend → Vercel/Netlify/Cloudflare Pages** (user choice in stage 4)
    - **If using Better Auth**: cross-site cookie config is required here (frontend and Strapi Cloud are on different domains) — set `trustedOrigins` and production `defaultCookieAttributes`. See `references/auth-better-auth.md`
12. **Acceptance criteria for the POC** — drawn from the core loop in stage 2. The POC is done when the loop works end-to-end against the deployed Strapi Cloud backend.
13. **Open questions / parked items** — anything the user deferred

**File template**: write `06-claude-code-spec.md` from `templates/06-claude-code-spec.template.md` (the source of truth). It contains the full self-contained build spec: project overview, stack, repo layout, setup commands, the M1-M8 milestones, schemas, API surface, auth, frontend route tree, env vars, deployment, and acceptance criteria. Fill the framework-specific and auth-specific parts from the stage-4 choices — the template uses a worked example per framework; don't paste the wrong one.

Two correctness reminders when filling it in (these are easy to get wrong):
- **Strapi scaffold**: TypeScript is the default and `--quickstart` is **deprecated** and conflicts with `--dbclient` — don't use it. For an automated build use `npx create-strapi-app@latest apps/cms --non-interactive --skip-cloud --dbclient=postgres --dbhost=... --dbport=... --dbname=... --dbusername=... --dbpassword=...` (without `--non-interactive` + the `--db*` flags the CLI prompts).
- **Frontend env vars**: only browser-safe values get the framework's public prefix (`NEXT_PUBLIC_`/`VITE_`/`PUBLIC_`/`NUXT_PUBLIC_`). A server-only Strapi API token must be **unprefixed** (`STRAPI_API_TOKEN`) or it leaks into the client bundle.

---

## When the user wants to revise an earlier stage

The skill is flexible — the user can say "actually, I want to change the user persona" or "let's swap Postgres for SQLite" at any point. When they do:

1. Open the relevant file and make the revision.
2. Walk forward through the later stages and ask: *"Does this change affect [stage X]?"* — for example, swapping the database may or may not affect the data models in stage 5.
3. Update any downstream files that need it.
4. Re-present the changed files.

Don't silently update downstream stages — always confirm with the user. They might want the change to be local, or they might want it to ripple.

---

## Tone & pacing

- **One stage at a time.** Don't dump all six stages of questions at once.
- **2-3 questions per turn**, not 10. Wait for answers, then go deeper.
- **Summarize back** what you heard before drafting the file — this catches misunderstandings cheaply.
- **Be opinionated about process, neutral about choices.** The order of stages is fixed (value first, tech last); but within each stage, the user's preferences win.
- **Watch for tech-first drift.** If the user keeps trying to talk about frameworks during stages 1-3, gently park the tech thoughts in a notes section for stage 4 and steer back.

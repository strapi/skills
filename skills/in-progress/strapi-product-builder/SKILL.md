---
name: strapi-product-builder
description: Run a structured, business-value-first product-planning interview that turns a fuzzy idea into a build-ready spec — BEFORE any code is written. Use this the moment someone is still figuring out WHAT to build and says things like "I have an idea for an app, help me think it through", "help me plan/scope/design my product", "where do I start?", "let's spec this out before I write code", or "turn this into a PRD". Covers any new app, site, SaaS, MVP, marketplace, or feature. Trigger on the planning intent alone — the user need NOT mention Strapi, a CMS, or any tech; a Strapi v5 + Strapi Cloud backend (overridable, with your choice of frontend and auth) is assumed by default. It nails value, users, and requirements before any tech decision, then produces six markdown files ending in a build spec you can hand to any coding agent (Claude Code, Cursor, etc.). Do NOT use once a spec or project exists and the user wants to scaffold, configure, migrate, add pages, wire auth, or debug — those are build tasks, not idea-stage planning.
---

# Strapi Product Builder

A structured, interview-driven process that turns a product idea into a build-ready spec for a **Strapi-backed project**. The output is six markdown files in a project folder — the last one is detailed enough that any coding agent (Claude Code, Cursor, etc.) can start building the POC immediately, with Strapi content types, API routes, and seed data scaffolded.

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
3. **This skill's own `references/`** — for build-sensitive specifics consult `references/strapi-build-cookbook.md` (the non-obvious Strapi v5 traps) and the other reference files, then fall back to the official docs. This skill is **self-contained**: it references only official Strapi sources (docs, official blog posts, official starters such as `strapi/LaunchPad`) and never depends on any other skill being installed. The stage-6 spec must always stand on its own — buildable from it + the official docs.

**When to cite the docs in the output files**: whenever stage 5 or 6 references a non-obvious Strapi feature (lifecycles, components vs. dynamic zones, draft & publish, i18n, RBAC, custom fields, document service queries), include a link to the relevant docs page so the future build session (whatever coding agent runs it) can verify the API surface before generating code. Curated, capability-tagged sources (official docs, Strapi blog tutorials, reference repos) live in **`references/resources.md`** — cite the matching entry, and re-verify any blog tutorial's exact commands/versions against current docs first (tutorials drift).

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
│   ├── strapi-build-cookbook.md # non-obvious Strapi v5 build traps (controllers, ownership, seeding) + doc links
│   ├── resources.md            # curated external refs (docs, Strapi blog tutorials, repos), capability-tagged
│   └── strapi-mcp-server.md    # built-in Strapi MCP server (v5.47+, GA since 5.49) — optional product capability
├── templates/                  # one .md per stage — the file templates the skill writes
│   ├── 01-product.template.md
│   ├── 02-users.template.md
│   ├── 03-requirements.template.md
│   ├── 04-tech-decisions.template.md
│   ├── 05-tech-requirements.template.md
│   └── 06-build-spec.template.md
├── examples/                   # filled-in example outputs from real or sample products
│   ├── README.md
│   └── trailhead/              # worked example (predates some current rules — see its README)
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
| **Claude Code** | `Write`/`Edit`/`Bash` tools available | Create a real folder at `<cwd>/<product-name-kebab-case>/` (or ask user where) and write the six `.md` files there. |
| **Claude Desktop** with filesystem MCP | A filesystem MCP server is connected (e.g., `mcp__filesystem__*`) | Write files via the MCP into a user-chosen folder. Ask the user to confirm the path the first time. |
| **Claude Desktop** without filesystem MCP, or **claude.ai web** | Only `artifacts` / `present_files` / inline display | Produce each stage's content as an **artifact** (`text/markdown`) the user can open, edit, copy, or download. Tell the user how to save them locally. Six artifacts total — one per stage. |

**Stage-6 spec rendering** — regardless of surface, the final `06-build-spec.md` must be self-contained enough that the user can paste it into a fresh session of any coding agent (Claude Code, Cursor, etc.) and build straight from it + the official Strapi docs.

**Self-contained build spec** — the spec never depends on any other skill being installed. Describe each build step concretely (commands, schemas, config) so any future coding-agent session can execute it from the spec + the official Strapi docs alone.

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
| 6 | `06-build-spec.md` | Build-ready markdown any coding agent can act on |

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

**Watch for two things that quietly break later stages — reconcile them now, not at stage 5:**
- **Scope contradiction — especially single-user vs. multi-tenant/SaaS.** "Just a tool for me" and "multiple teams/orgs/gyms use it, white-labeled" are different products: multi-tenancy adds tenant-scoping to *every* entity in stage 5. If the user's framing drifts, name it and pin the MVP scope.
- **Strapi-fit red flags.** If the user states a hard requirement Strapi v5 can't meet — a document/NoSQL database like **MongoDB** (Strapi is **SQL-only**), or offline-first/edge-only — surface it here, honestly: change the constraint, or recommend a more general product-design skill. Don't carry an impossible assumption forward to stage 4.

**Interview questions to ask** (don't ask them all at once — ask 2-3, wait, follow up):

- In one sentence, what is this product?
- What problem does it solve? Whose problem?
- What does the customer (or user) get out of it that they can't get today?
- What's the "before and after" — what does someone's life/work look like before using this vs. after?
- Is this a tool, a service, a marketplace, a platform, a content product? (Helps frame the value.)
- What would success look like a year in? (Not metrics — a picture.)
- How do people handle this today, and why does that fall short? (**Today's workaround** — the thing the product has to beat, not just "nothing".)
- What is the **riskiest assumption** — the one that, if wrong, makes the product pointless? (Often: will enough people contribute, or will users switch from the tool they already use?)
- What would you see in the **first month** that tells you it's working? (An early signal you can observe, not the year-one picture.)

Why these three: a fresh-eyes review of `examples/trailhead/` found the product's biggest risk (no trail reports on day one, so no reason to come back), and none of its stage-1 answers had surfaced it. Stage 2 then asks the workaround again per persona.

**File template**: write `01-product.md` from `templates/01-product.template.md` (the source of truth). Sections: One-liner · The problem · The value · Today's workaround · Riskiest assumption · Early signal · Product category · What success looks like.

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
- **Metrics the value depends on** — if the product's value rests on a measure ("fresh", "verified", "nearby"), define it here in plain words: what counts, and over what time window. The robustness sweep's *Metric definitions* item turns it into a formula later; if it waits until then, every earlier stage argues about a word nobody defined
- **Account/auth** — sign-up, sign-in, identity (capability level: "users must be able to sign in", not "use OAuth"). Note: Strapi has built-in Users & Permissions for end-users plus a separate Admin auth — flag here whether the product needs end-user accounts, admin-only content editing, or both. For **each role**, write down which account system it lives in: a Strapi **admin** account (the team, in `/admin`) or an **end-user** account (the API). A role like "moderator" is ambiguous until this is written down
- **Content the product manages** — at a conceptual level (e.g., "articles", "products", "team members"). Distinguish *editorial content* (managed by admins in Strapi's CMS) from *user-generated content* (created via the Strapi REST/GraphQL API by end users). When *who edits this* is unclear (a brief just says "editors"), resolve it with the **team → admin panel vs. end-users → API** rule in `references/content-modeling.md`. Do not write schemas yet
- **Where the first content comes from** — for each content type the core loop needs on day one: who creates it, or where it's imported from (and under what licence)? And when a user wants to post about something that isn't listed yet, what do they do? An empty catalogue, or a missing item with no way to add it, stops the core loop
- **Removing bad content** — if users create content: who can hide or remove it, how a user reports it, and how fast. "The team deletes it in the admin panel" is an answer; "later" leaves no takedown path. Stage 5 decides the mechanism (unpublish, a `hidden` flag, or delete) and the admin role that uses it
- **Reusable content patterns** — note when the same shape repeats across entities (hero sections, SEO blocks, address) — these become Strapi *components*. Note when one slot needs to hold multiple shapes (page builder, flexible layout) — these become *dynamic zones*. Still capability-level only
- **Localization & drafts** — does the product need multi-language content (Strapi i18n) or a draft/publish workflow? Capture as a yes/no requirement here
- **Integrations needed** — third-party services the product must talk to (named at the capability level: "send email", "process payments")
- **AI / agent access (MCP)** — does the product need AI agents or AI-powered features to read/write its content (assistants, copilots, content automation)? Strapi ships a built-in **MCP server** for exactly this (GA since v5.49). Capture as a yes/no capability here; the tech decision lands in stage 4. See `references/strapi-mcp-server.md`
- **Non-functional requirements** — performance expectations, scale assumptions, security needs, compliance (GDPR, HIPAA, etc.)
- **Out of scope (for MVP)** — explicit list of what the v1 will NOT do, to prevent scope creep

**Interview questions**:
- For the MVP, what's the minimum the product must do for a user to get value?
- What can wait until v2?
- Are there compliance or regulatory needs (data residency, healthcare, finance)?
- How many users do you expect in the first 6 months? First year?

**File template**: write `03-requirements.md` from `templates/03-requirements.template.md` (the fuller version — it splits editorial vs user-generated content and flags reusable shapes/dynamic zones and i18n/draft-publish). Sections: Core features · Value metrics · Account & auth · Content the product manages (with where the first content comes from, and removing bad content) · Localization & drafts · Integrations · AI / agent access (MCP) · Non-functional requirements · Out of scope.

---

## Stage 4 — Tech decisions

**Goal**: Choose the tech stack. **Now** is when tech enters the conversation — and it's chosen to fit the requirements, not the other way around.

**Defaults this skill is opinionated about** (the user can override any of them, but state them up front):

| Area | Default | Rationale |
|---|---|---|
| Backend / CMS | **Strapi v5** | Headless CMS with admin UI, REST + GraphQL out of the box, content types map cleanly from stage 3 |
| Database | **PostgreSQL** | Strapi's recommended production DB; works on Strapi Cloud and most hosts |
| Hosting (backend) | **Strapi Cloud** | Managed Strapi: zero infra, automated upgrades, built-in CDN/media, Postgres included. See `references/strapi-cloud-deploy.md` |
| API style | **Strapi REST** with route middlewares for population (GraphQL plugin if the frontend needs it) | Matches Strapi's defaults |
| Frontend | **User's choice — always ask** (first-class: Next.js, TanStack Start, Astro, Vue/Nuxt) | Strapi is headless; any frontend works. No silent default. See `references/frontend-frameworks.md` |
| Auth | **Stock Users & Permissions** (Better Auth plugin as opt-in) | U&P ships with Strapi, is production-ready, matches the default Cloud-deploy path, and already supports social providers such as Google. The **`strapi-community/plugin-better-auth`** plugin (2FA/magic links/passkeys) is the *opt-in* upgrade — ⚠️ beta, not for production per its maintainers, needs Strapi ≥ 5.45, removes U&P. Offer it only when the user wants those features and accepts POC risk. See `references/auth-better-auth.md` |

**Process**:

1. State the defaults above and ask: *"Backend will be Strapi v5 deployed to Strapi Cloud unless you have a reason to choose otherwise. For the frontend — I support Next.js, TanStack Start, Astro, or Vue/Nuxt well (or another framework you prefer). Anything you already have in mind?"*
2. **Frontend — always ask, never assume.** There is no silent default. Once chosen, that choice parameterizes stages 5-6 (scaffold command, route tree, env-var prefix, auth wiring) per `references/frontend-frameworks.md`.
   - Ask it **as its own question**, and wait for the answer. Don't fold the framework into another option or into a list of other decisions. *"A. A Next.js web app"* answers "what kind of interface" and "which framework" at once.
   - Give the first-class options with a one-line trade-off each, measured against this product's requirements, and mark none as recommended. If the user asks which you'd pick, say so then.
   - Only the user's answer to that question picks the framework. A general approval of a list of recommendations ("use these", "accept all") doesn't; ask the question again. Record the answer in 04's **Frontend framework › Chosen by**.
   - Seen in a test run: the framework sat inside a "recommended" interface option in a four-part question. The user answered another part, later approved the list, and Next.js was recorded as decided without ever being asked.
2b. **Reference repos → binding conventions.** When the user supplies repos or prior projects ("architect it like X", "use Y as inspiration"), separate two things explicitly: **code reuse** (usually forbidden — greenfield) and **conventions** (usually binding). Extract the concrete conventions from each reference (plugin structure, folder layout, patterns — e.g. "local plugins: `sdk-plugin` TS structure per `<repo>`") and record them in `04-tech-decisions.md` as **binding**, carried into stages 5-6 as constraints. Never record a reference as just "inspiration only" — that reads as license to deviate.
3. **Auth — default to stock Users & Permissions; offer Better Auth as the opt-in.** U&P is built in and production-ready, which matches the default Strapi Cloud deploy target. Offer the Better Auth plugin only when the requirements need something U&P lacks — 2FA, magic links, passkeys, or a provider U&P doesn't offer. **Social login alone isn't a reason:** U&P supports Google, GitHub and other providers (https://docs.strapi.io/cms/configurations/users-and-permissions-providers/google). Before choosing Better Auth, write in 04 what U&P lacks for this product. Say its status plainly: *"For auth the default is Strapi's built-in Users & Permissions — production-ready, and it supports social login through its providers. If you need 2FA, magic links or passkeys there's the Better Auth plugin, but it's currently beta (its maintainers say not for production), so it's a fit for a POC, not a launch. Which fits?"* Record the choice and its implications (the permissions model differs — see below).
3b. **Session topology — decide it here, not in stage 5 or 6.** In the default stack the frontend (`*.vercel.app`, `*.netlify.app`) and Strapi (`*.strapiapp.com`) are on **different sites**, so a cookie Strapi sets is third-party to the frontend, and Safari blocks third-party cookies by default. `SameSite=None; Secure` doesn't fix that. And because `vercel.app`, `netlify.app`, `pages.dev` and `strapiapp.com` are on the Public Suffix List (https://publicsuffix.org), no cookie can be shared across them either: the only shared parent domain is a custom one. Options 1 and 2 decide how the browser reaches Strapi whenever a Strapi cookie is involved; option 3 decides where the session lives afterwards, so it can combine with them. Record the choice in 04:
   1. **Shared parent domain** — custom domains such as `app.example.com` and `api.example.com` (every Strapi Cloud plan includes custom domains). Cookies become same-site.
   2. **Proxy** — the frontend's server forwards auth and API calls to Strapi, so the browser only talks to its own origin.
   3. **Token held by the frontend's server** — the U&P JWT kept in an `httpOnly` cookie on the frontend's own domain and sent to Strapi as a bearer token from server-side code. Client-side refetches then go through the frontend's own routes, not straight to Strapi.

   - **Stock U&P, email/password:** option 3 alone.
   - **U&P social login:** option 1, then option 3 for the session. The provider flow's last step is the browser calling Strapi with Strapi's own session cookie (`credentials: 'include'`, per https://docs.strapi.io/cms/configurations/users-and-permissions-providers). A proxy works in principle, but it changes Strapi's `url` and every callback URL and hasn't been checked end to end.
   - **Better Auth:** option 1 or 2 — Better Auth's docs give the same two fixes for Safari (https://www.better-auth.com/docs/concepts/cookies).
   - **Previews:** with option 1, preview deploys on `*.vercel.app` aren't under the shared domain, so sign-in that needs Strapi's cookie fails there. Record how previews sign in under Environments.

   The review of `examples/trailhead/` found this decision missing and called it build-blocking.
4. **MCP server — ask whether the product needs AI agents to manage its content.** If stage 3 flagged AI/agent read/write of content (assistant / copilot / automation over the CMS), ask plainly: *"Do you want to expose Strapi's built-in MCP server so AI agents can read and write your content? It's GA since Strapi 5.49 and production-ready — the main limitations are no new media uploads and untyped dynamic zones."* **Off by default** — enable only on a clear yes (it's an attack-surface decision, not a maturity one). If enabled, bump the Strapi version floor to **≥ 5.49** and record the scoped-token plan. See `references/strapi-mcp-server.md`.
   > **If the answer is yes, ask the follow-up that actually matters: will agents do REAL WORK here, or just browse?** For real work, spec **purpose-built domain tools** and scope tokens to those tools only — the auto-generated CRUD tools require the full record on update (a truncated resend silently destroyed a 1,200-word post in a real session), reject `$null`/enum filters, and return relations as bare ids. Partial-update tools that simply don't expose immutable fields make that class of data loss impossible. Details + the result-size guard in `references/strapi-mcp-server.md`.
5. Listen to preferences. If they push back on Strapi Cloud (cost, region, on-prem requirement), capture it and move to a self-hosted Strapi option (spec the Dockerfile + `docker-compose` with Postgres in stage 6 — see the Strapi Docker guide on https://docs.strapi.io).
6. For each area below, either confirm their choice (with a brief sanity-check against the requirements) or suggest options if they're undecided. When suggesting, give 2-3 options with tradeoffs — don't just hand down a winner. The frontend framework is always asked on its own (step 2).
7. For each decision, capture the **why** — what requirement or preference drove the choice.

**Areas to cover**:

- **Backend / CMS** — default Strapi v5. Note Strapi version, Node version target (an Active or Maintenance LTS that Strapi supports — https://docs.strapi.io/cms/installation/cli — and, on Strapi Cloud, one it offers: 22 or 24 as of October 2026), and whether any plugins are anticipated (i18n, Users & Permissions, GraphQL, custom fields)
- **Module organization** — when the product is "built in modules": default to **`src/api/<name>` folders** (Strapi's native feature unit; content-type optional — route-only and service-only APIs are valid, and custom MCP tools register app-level). Choose **local plugins** only when a module needs admin-panel UI, cross-project reuse, or distribution — they add a build step `strapi develop` doesn't watch. Decide explicitly and record the why; see the modules entry in `references/strapi-build-cookbook.md`
- **Database** — default Postgres on Strapi Cloud. SQLite is fine for local dev only. **Strapi v5 is SQL-only (PostgreSQL/MySQL/MariaDB/SQLite); MongoDB / document DBs are not supported** — if the user wants Mongo, that's a stage-1 product-fit issue (Strapi is the wrong backend), not a stage-4 tweak
- **Hosting — backend** — default Strapi Cloud. Alternatives: Render, Railway, Fly.io, AWS, self-hosted Docker. On Strapi Cloud, record the plan: there is no free plan, and the entry plan sleeps when idle and has no backups (fine for a POC, not for a product people depend on). While a project sleeps, cron tasks can't run and the first request, including a webhook, waits for it to wake — check this before relying on either. See `references/strapi-cloud-deploy.md`
- **Environments** — which environments exist (local, preview, production), which Strapi each frontend environment calls, whether preview deploys can write production data (if yes, say why), and how previews sign in
- **Hosting — frontend** — Vercel, Netlify, Cloudflare Pages, etc. (all four first-class frameworks deploy to any of these)
- **Frontend framework** — no default; ask it on its own (step 2). First-class: **Next.js** (broad ecosystem, app-style products), **TanStack Start** (type-safe full-stack React), **Astro** (content-heavy/static sites), **Vue/Nuxt** (Vue teams). Others (SvelteKit, SolidStart, Remix, plain React) supported too. See `references/frontend-frameworks.md`
- **Auth** — default is Strapi's built-in **Users & Permissions** for end-users + Strapi admin auth for editors (production-ready, zero extra setup, social providers included). Opt-in: the **better-auth plugin** when the user needs 2FA/magic links/passkeys and accepts POC risk (*beta*, needs Strapi ≥ 5.45, removes U&P). External providers (Clerk, Auth0) only if SSO/enterprise needs justify. See `references/auth-better-auth.md`
- **Media / file storage** — Strapi Cloud bundles media + CDN by default. For self-hosted: S3, R2, Cloudinary via the upload provider
- **CI/CD** — GitHub Actions for the frontend; Strapi Cloud has built-in deploy-on-push
- **Email / notifications** — Strapi email provider (Sendmail, SendGrid, Mailgun, Resend)
- **Payments** — Stripe / Lemon Squeezy / Paddle if applicable, called from custom Strapi controllers or the frontend
- **Analytics & monitoring** — PostHog, Plausible, Sentry; at least enough to see the early signal from `01-product.md`
- **MCP server (AI agent access)** — **off by default.** If stage 3 flagged AI/agent content access, enable Strapi's built-in MCP server (GA since v5.49): `mcp.enabled` in `config/server`, exposed at `POST /mcp`, authed with a scoped Admin API token. Extend with custom tools via a plugin (`strapi.ai.mcp`). Don't enable speculatively. See `references/strapi-mcp-server.md`
- **Optional dependencies & degradation** — for **each** external service (AI provider, email, payments, search, …): required or optional? If its key/config is absent, does the feature **disable cleanly** (feature flag + hidden UI + 503, core loop unaffected) or does the app break? Decide per dependency and record it — retrofitting graceful degradation after a build is far costlier than designing it in. Also record how each one is **tested without production keys**: a sandbox or test key, a local mock reached through the SDK's base-URL setting (an OpenAI mock behind `OPENAI_BASE_URL` covered success, failure and a double-spend race in a real build), or a stub
- **Session topology** — where the session lives and how it crosses from the frontend's site to Strapi's (step 3b above)
- **Styling** — Tailwind by default

If a requirement from stage 3 makes a choice questionable (e.g., user needs offline-first sync, which Strapi doesn't natively do), flag it gently and discuss tradeoffs. Use the strapi-docs MCP or `WebFetch` against https://docs.strapi.io to verify capability claims before recommending against Strapi.

**File template**: write `04-tech-decisions.md` from `templates/04-tech-decisions.template.md`. For each decision capture **Choice · Considered · Why**. Record the frontend framework explicitly (it drives stages 5-6) and the auth choice with its implications (stock U&P → Public/Authenticated roles (default); or Better Auth → beta + removes U&P + needs api-permissions, plus what U&P lacks). Record the session topology and the environments too.

---

## Stage 5 — Tech requirements (detailed spec)

**Goal**: Translate the requirements (stage 3) and tech decisions (stage 4) into concrete technical artifacts: **Strapi content types**, REST/GraphQL endpoints, custom controllers, and frontend routes.

This is the engineering blueprint. It's still readable by humans but it's where the abstract "users can sign in" becomes an auth-protected route and a `User` collection in Strapi.

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
  - Draft & publish: yes/no — set `draftAndPublish` explicitly in every schema. Omitted means **off** in a hand-written `schema.json`, while the Content-Type Builder ticks it **on** for new types (see `references/content-modeling.md`). If it's on for user-generated content, say how a user's post gets published
  - Localized: yes/no (per field if needed)
  - Validations / unique constraints
- **Strapi components** — reusable shapes used by multiple content types or inside dynamic zones (e.g., `shared.seo`, `shared.cta`, `blocks.hero`)
- **Strapi dynamic zones** — slots that accept a list of components (typical for page builders)
- **API surface**:
  - Auto-generated Strapi REST endpoints we will use (and any we will *disable* via permissions)
  - Default population strategy — describe via route middleware (see https://docs.strapi.io/cms/api/rest/populate-select), not query params on every call
  - Custom controllers / routes — list with method, path, auth (better-auth session required vs. public), request/response shape, description
  - GraphQL — only if installed. List queries/mutations the frontend depends on
- **MCP server** — *only if enabled in stage 4.* Note `mcp.enabled` in `config/server`, which content types/actions are exposed, the scoped Admin API token strategy (least-privilege per use case), any custom tools added via a plugin (`strapi.ai.mcp`), and the known limitations (no media upload, dynamic zones untyped, stateless `POST /mcp` only). See `references/strapi-mcp-server.md`
- **Auth flows** — sign-up, sign-in, sign-out, password reset, social providers (which ones, if any), and how the frontend gets the session — written for the stage-4 choice (stock U&P by default; Better Auth path references https://github.com/strapi-community/plugin-better-auth and https://better-auth.com). Give the **session** its own subsection: where it lives (per the stage-4 topology), the cookie flags (`httpOnly`, `secure`, and a `sameSite` value that fits the topology), its lifetime (matching the backend token lifetime), and what happens when it expires
- **Permissions & roles** — keep **end-user roles** (content API) and **admin roles** (`/admin`) in separate lists, matching each role's account system from 03. *Depends on the stage-4 auth choice.* **Stock Users & Permissions**: roles (Public, Authenticated, custom) and what each can read/write per content type. **Better Auth path**: content-API permissions are governed by `@strapi-community/plugin-api-permissions` instead (U&P is removed) — describe permissions in those terms. Admin roles for the editorial side either way. See `references/auth-better-auth.md`
- **Lifecycles / policies / middlewares** — choose the layer by context: request/auth-aware logic (stamp `owner`/`author` = current user) goes in the **controller**; document-level logic without the request (slug generation, derived fields, notifications) goes in **Document Service middleware** (`strapi.documents.use()` in `register()`); **lifecycle hooks are no longer the v5 default** (no request context; fire twice on publish). For server-set fields, the `is-owner` policy, and owner-scoped reads, follow `references/strapi-build-cookbook.md` — the naive approaches return 400 in v5
- **Pages & key components (frontend)** — the route/page tree in the **chosen framework's** convention (`app/`, `src/routes/`, `src/pages/`, or `pages/`). For each route:
  - **Access** — public, signed in, or a role
  - **Data and credential** — where it fetches Strapi data (loader/Server Component/`useFetch`/frontmatter) and with what: no credential (a public endpoint, e.g. called from the browser), a custom API token limited to the read actions it needs (server-side calls only — not the read-only type, which can read every `find` route, `GET /api/users` included), or the user's session
  - **Rendering** — built ahead, rendered per request, or in the browser; for built-ahead pages, how published content reaches the live site (rebuild, time-based refresh, or a Strapi webhook)
  - **States** — on core-loop routes: loading, empty, and error (including "not found")
  - Components, and any client interactivity. See `references/frontend-frameworks.md`
- **Server-side handlers** — a table of every frontend server-side handler that calls Strapi (route handler, server action, loader, server route): the credential it calls Strapi with, and what it checks first. A handler that reads private data or writes for a user checks the session before it calls Strapi; a public read that sends a token uses a custom token limited to the read actions it needs, never read-only or full-access; a user ID or owner comes from the session, never from the request body
- **State management** — server state via the framework's data layer (loaders / Server Components / `useFetch`) plus TanStack Query for client refetches where needed; URL state for filters; minimal client state
- **Background jobs / scheduled tasks** — Strapi cron tasks (`config/cron-tasks.ts`, with `cron.enabled` in `config/server`) or external (e.g., Strapi Cloud doesn't expose long-running workers — flag if needed)
- **Media & uploads** — Strapi Cloud media (default) or external provider; image formats and responsive variants
- **Outside services and other apps** — every external service (payments, email, AI, search, …) and every other app in the product (a worker, a second frontend, a script that writes data): what it's used for, required or optional, what users see when it fails (from the stage-4 degradation decision), and its test mode (sandbox or test key, a local mock via the SDK's base-URL setting, or a stub). Keys a browser can see must be ones the provider marks browser-safe
- **Hosting & environments** — every app's host; the environments (local, preview, production) and which Strapi each frontend calls in each; **CORS**: `strapi::cors` lists exactly the origins whose browsers call Strapi directly (none if every call goes through the frontend's server), never `*` with credentials, and preview patterns limited to domains the team controls; CI (what runs on each push), or N/A with a reason
- **Environment variables / secrets** — separate lists for the Strapi backend and the frontend. Use the chosen framework's **public** prefix for browser-safe values (`NEXT_PUBLIC_`/`VITE_`/`PUBLIC_`/`NUXT_PUBLIC_`) and **no public prefix** for server-only secrets (e.g. a Strapi API token used in SSR fetches must NOT be public-prefixed or it leaks to the client bundle). On Strapi Cloud, set **no** `DATABASE_*` variables: Cloud provides its own PostgreSQL, and any `DATABASE_*` variable switches the project to an external database

**File template**: write `05-tech-requirements.md` from `templates/05-tech-requirements.template.md` (the source of truth). It covers: content types (with field tables), components, dynamic zones, API surface (REST/population/custom routes/GraphQL), auth flows and the session, permissions & roles, lifecycles/policies/middlewares, the frontend route tree (with each route's access, data, rendering and states), server-side handlers, state management, background jobs, media, outside services and other apps, hosting & environments, env vars, and the robustness-sweep record. Adapt the auth and frontend sections to the stage-4 choices (see `references/auth-better-auth.md` and `references/frontend-frameworks.md`) — don't assume Better Auth or TanStack Start if the user chose otherwise.

**Robustness sweep — run this WITH the user after stage 5, before stage 6.** Feature interviews reliably miss operational hardening; don't wait for the user to ask "what's missing?". Walk this checklist and fold accepted items into 05 (they're each cheap to spec, expensive to retrofit). Then record the outcome in 05's **Operations (robustness sweep)** section: one line per item, saying where 05 specifies it, or `N/A — <reason>` when the user declines it — otherwise nothing shows the user decided it, and a reviewer can't tell a declined item from a forgotten one:
- **Silent failure modes** — pipeline/webhook errors: dead-letter storage (never drop data), ops alerting channel, "the tool must never fail silently". Spec the **replay path** too: a dead-letter store nothing can re-run is a write-only graveyard
- **Uniqueness under concurrency** — for every field the product treats as an external identity key (`externalId`, `slug`, `key`): schema `unique: true` is validation-layer ONLY, so Document-Service/ingest/cron writes duplicate freely and duplicates then deadlock the rows. Spec a real DB unique index + a create-catch-refetch writer (cookbook: *"`unique: true` is a VALIDATION rule"*)
- **Recurring-job reentrancy** — any cron doing per-item network calls: overlap guard + retry cap + one park alert. Strapi's scheduler does not serialize async runs, so "every minute" plus slow work equals concurrent duplicate work
- **Transactional workflow steps** — any operation that writes 2+ records (status + audit row + notification): one transaction, guards re-checked inside it, side effects outside. Put these on the **service** so custom routes, agent tools, and jobs share one implementation of the rules
- **Session lifetime** — state the intended sign-in duration explicitly and check the auth config actually produces it (U&P `jwtManagement: 'refresh'` defaults to 10-minute access tokens; without a frontend rotation loop users get logged out constantly)
- **User-data exposure** — current user via `/api/users/me` ONLY; never seed `user.find` (account enumeration) or `user.update` (the stock `PUT /api/users/:id` has no ownership check — anyone signed in can edit any account); "edit my profile" is a custom route that takes the user from the session; user identity on other records whitelisted to `id`/`username` (see the cookbook entry)
- **Metric definitions** — any score/KPI the product reports: ONE documented formula (window, weighting, timezone) or the dashboard number becomes contested
- **Human correction loops** — anywhere AI/automation labels data: can a human override, does the override survive re-processing, is it flagged as human-set?
- **Reproducibility/versioning** — stamp model/prompt/config versions on computed results so tool changes don't masquerade as data shifts
- **Cost guards** — external-API budget counters with warn/halt thresholds. Where users trigger paid calls (AI generation), a per-user limit charged atomically **before** the call and refunded on failure — a check-then-call lets parallel requests spend past the limit
- **Aging/SLA visibility** — queues need staleness flags and a digest, or old items rot invisibly
- **Audit trail** — who did what, when, per record — if the product's value includes "the full data trail," model it explicitly
- **Search** — any "library of past X" value prop needs full-text search, not just filters
- **Empty states** — greenfield data means sparse day-one dashboards; design for it

---

## Stage 6 — Build spec

**Goal**: Produce a single markdown file (`06-build-spec.md`) that any coding agent (Claude Code, Cursor, etc.) can read and immediately start building a Strapi v5 POC with the **frontend chosen in stage 4**. This file is the synthesis of stages 1-5, reformatted for an AI coding agent.

This file must be **self-contained** — the build agent never needs the other five files. Copy the content in; never point at another stage file *instead of* giving it ("see stage 5" is a dead reference in a fresh session). In particular, inline the full `schema.json` for every content type and component, and the code that seeds permissions. Where no verified code exists yet (seeding `plugin-api-permissions` on the Better Auth path), write an explicit build-time step instead: where to fetch the snippet, and how to check the result. A one-line "background: 05" mention is fine only when the content itself is already in 06.

**Up-front instructions to bake into the spec for the build session**:
- **Deviation protocol (bake this sentence into the spec, verbatim in spirit):** *"Commands, structures, and reference conventions in this spec are user decisions. If you want to substitute any of them — build friction, a newer API, a 'simpler' alternative — STOP and ask the user; do not silently trade off."* Build agents rationalize shortcuts precisely when momentum is highest; this line is what stops them.
- Use the **strapi-docs MCP** (if installed) for any Strapi API question; otherwise `WebFetch` https://docs.strapi.io.
- **Include the chosen frontend framework's current docs in the spec's docs-lookup header** (Next https://nextjs.org/docs · Astro https://docs.astro.build · Nuxt https://nuxt.com/docs · TanStack Start https://tanstack.com/start/latest/docs) and instruct the build session to verify version-sensitive conventions (file names, config keys, async APIs) against them — frameworks rename conventions across majors and legacy compat hides it (e.g. Next 16: `proxy.ts`, not `middleware.ts`). A Strapi-docs-only spec trains the builder to verify one side of the stack and freehand the other.
- The spec is **self-contained** — it never assumes any other skill is installed. Every build step is described concretely (commands, schemas, config) so the build session can execute it from the spec + the official Strapi docs alone.
- **Inline the relevant `references/strapi-build-cookbook.md` traps into the spec itself** — a pasted `06-build-spec.md` in a fresh agent session cannot read this skill's files, so a pointer to `references/…` is dead text. Copy the applicable patterns into the matching milestones: server-set fields like `owner`/`author` stamped via the Document Service in the controller, the `is-owner` policy, slug generation via Document Service middleware for every uid-filtered type, owner-scoped reads, seeding loginable U&P users + both roles (idempotently, leaving U&P's own default grants in place), `/api/users/me` only and never `user.update`, a U&P `user` extension schema that repeats the whole base schema, a `trimUser`-style whitelist wherever a response returns a user relation, a custom API token (never read-only) for the frontend's server, no Public `plugin::upload` grants, Strapi's `url` when U&P sends links or runs social login, the session setup for the chosen topology, CORS origins, and seeding the U&P plugin settings (reset-password and confirmation URLs; providers if social login is on). Inlining is the rule, not an option. (The bundled Trailhead example predates this rule — its 06 still says "See stage 5" for the schemas — so don't copy that part.)
- For the Better Auth path, inline the install/config steps and link the official Strapi tutorial URL (https://strapi.io/blog/strapi-better-auth-tutorial-setup-guide-for-strapi-v5-and-next-js-16) — again, don't reference `references/auth-better-auth.md` from inside the spec.

**Required sections**:

1. **Project overview** — 2-3 sentence summary from stage 1, plus the one-liner
2. **Stack** — confirmed choices from stage 4 (Strapi v5, Postgres, Strapi Cloud, the **chosen frontend framework**, the **chosen auth approach**, plus the rest)
3. **Repo layout** — typical: monorepo or two folders (`apps/cms` Strapi + `apps/web` frontend), or two separate repos
4. **Setup commands** — concrete commands for both the backend and frontend. Use the **chosen framework's** scaffold command (see `references/frontend-frameworks.md`)
5. **Build order (milestones)** — discrete chunks the build agent can tackle one at a time. Each milestone has a clear "done when…" criterion. Default milestone shape:
   - **M1 — Strapi scaffold + Postgres + Strapi Cloud project linked** (the deployed project's first admin is created right after the first deploy)
   - **M2 — Content types, components, dynamic zones, draft/publish, i18n; permissions seeded in `bootstrap()`** (stock U&P path). On the Better Auth path, only the attributes that target its `user` wait for M3
   - **M3 — Auth**: stock U&P path → JWT lifetime, seeded plugin settings, Strapi's `url` (if email confirmation or social login), session wiring; or Better Auth path → install the 3 plugins, remove U&P, configure providers, seed the `plugin-api-permissions` roles (inline the steps from `references/auth-better-auth.md` + the official tutorial URL into the spec); on either path, the email provider in test mode if the product sends email
   - **M4 — Custom controllers, lifecycles, route middlewares (default population)**
   - **M5 — Frontend scaffold + public routes/pages + data fetching calling Strapi** (chosen framework), with a custom API token
   - **M6 — Auth UI wired to the auth client; signed-in routes and their server-side handlers work**
   - **M7 — Seed data + media uploads**
   - **M8 — Automated e2e suite + deploy + smoke test**: turn the POC acceptance criteria into a Playwright suite (tests inject their own data via the app's real entry points — e.g. the webhook — so they're seed-independent; social login is checked by hand, since Playwright can't drive a real provider), then the deploy in order — frontend host and custom domains, the Strapi variables that depend on them, provider redirect URIs, admin setup, frontend deploy — and a smoke test of the core loop

   Each milestone's "done when" must be checkable with what exists by then (M3 checks auth through the API, since the sign-in UI arrives in M6). Each frontend milestone names its routes and the Strapi calls behind them; a protected route also names its server-side session check, and a core-loop route its loading, empty and error states. The first milestone that uses an outside service the core loop depends on calls it in test mode; if the call fails, the build agent stops and reports to the user — a broken dependency found at M8 costs the whole build.
6. **Strapi schemas** — the full Strapi v5 `schema.json` for every content type and component (per the Content-Type Builder format in the docs), inline, with `draftAndPublish` set explicitly in each, each with its file path and, for a content type, its router, controller and service files
7. **API surface** — copied from stage 5: enabled REST endpoints, default population middlewares, custom routes/controllers, GraphQL (if any), plus the full permission matrix (role × action × content type, including `plugin::upload` — no Public upload action, and Authenticated never `find` or `destroy`) and the `bootstrap()` code that seeds it
8. **Auth** — install steps, config, providers, frontend client wiring for the chosen approach (Better Auth or U&P), the session (topology, cookie flags, lifetime), and the admin roles (what each can do, including hiding bad content, and how each exists on a fresh database)
9. **Frontend route/page tree** — file paths in the chosen framework's convention (`app/`, `src/routes/`, `src/pages/`, or `pages/`); for each route its access, data and credential, rendering (and refresh), and core-loop states; components; plus the server-side handlers table
10. **Outside services** — each one's env var names, what users see when it fails, and its test mode
11. **Environment variables** — full list (backend + frontend, and each outside service's test-mode values), with descriptions and example values (never real secrets). Use the framework's public prefix only for browser-safe values; keep secrets unprefixed
12. **Deployment**:
    - **Strapi backend → Strapi Cloud** (default). Steps: create project at https://cloud.strapi.io, link the Git repo, set env vars (no `DATABASE_*`), set Node version, push to deploy, and create the first admin right after the first deploy. Keep the Strapi folder self-contained — its own `package.json` and lockfile, outside any root workspaces (Strapi Cloud doesn't document workspace support). Reference: `references/strapi-cloud-deploy.md` and https://docs.strapi.io/cloud/getting-started/intro
    - **Frontend → Vercel/Netlify/Cloudflare Pages** (user choice in stage 4)
    - **Session and CORS**: implement the chosen session topology with the settings from the per-topology table in `references/auth-better-auth.md` (Better Auth) or the cookbook's cross-site entry (U&P) — `SameSite=None` cookies between `*.vercel.app` and `*.strapiapp.com` are still third-party, and Safari drops them. `strapi::cors` lists exactly the deployed origins whose browsers call Strapi
    - **Environments & CI**: each environment and the Strapi each frontend calls in it; how previews sign in; any Strapi webhook (URL, secret header, events — a user step per environment, since webhooks live in the database); what CI runs on each push
13. **Operations** — each robustness-sweep item the user accepted, with the milestone that builds it
14. **Acceptance criteria for the POC** — drawn from the core loop in stage 2. The POC is done when the loop works end-to-end against the deployed Strapi Cloud backend.
15. **Open questions / parked items** — anything the user deferred, plus the riskiest assumption from 01 and how the POC tests it

**File template**: write `06-build-spec.md` from `templates/06-build-spec.template.md` (the source of truth). It contains the full self-contained build spec: project overview, stack, repo layout, setup commands, the M1-M8 milestones, schemas, API surface (with the permission matrix), auth and session, frontend route tree and server-side handlers, outside services, env vars, deployment (with environments and CI), operations, acceptance criteria, and open questions. Fill the framework-specific and auth-specific parts from the stage-4 choices — the template uses a worked example per framework; don't paste the wrong one.

Correctness reminders when filling it in (these are easy to get wrong):
- **Strapi scaffold**: TypeScript is the default and `--quickstart` is **deprecated** and conflicts with `--dbclient` — don't use it. For an automated build use `npx create-strapi-app@latest apps/cms --non-interactive --skip-cloud --no-example --no-git-init --dbclient=postgres --dbhost=... --dbport=... --dbname=... --dbusername=... --dbpassword=...` (the `--db*` flags alone still prompt — see the cookbook's Scaffold entry).
- **Node version**: an LTS that Strapi supports and Strapi Cloud offers — 22 or 24 as of October 2026 (check the Node version drop-down in the Cloud project settings). Not "≥ 20": Node 20 is no longer supported.
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
- **Keep an open-questions ledger.** Real stakeholders answer out of order, partially, or not at all. Track every unanswered/half-answered question explicitly; re-ask once at the next natural moment; whatever is still open gets written into the stage file as a **flagged assumption** ("⚠️ assumption — unconfirmed: …"), never a silent guess. Carry the ledger forward — stage 6 lists surviving assumptions under Open questions.
- **Summarize back** what you heard before drafting the file — this catches misunderstandings cheaply.
- **Be opinionated about process, neutral about choices.** The order of stages is fixed (value first, tech last); but within each stage, the user's preferences win.
- **Watch for tech-first drift.** If the user keeps trying to talk about frameworks during stages 1-3, gently park the tech thoughts in a notes section for stage 4 and steer back.

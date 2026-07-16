---
name: strapi-version-upgrade
description: Upgrade a Strapi application to a new version. ALWAYS reviews the relevant breaking changes first (via the strapi-docs MCP server, or by fetching the docs directly if the MCP is unavailable), then performs the upgrade using the official @strapi/upgrade tool. Use whenever the user wants to upgrade, update, or bump their Strapi version.
---

# Strapi version upgrade

Upgrade a Strapi project to a target version. This skill enforces two hard rules:

1. **Always check breaking changes before upgrading.** Never run the upgrade without first reviewing the breaking changes that apply between the current version and the target.
2. **Always use the `@strapi/upgrade` tool to perform the upgrade.** Never upgrade by manually editing `package.json` or running `npm install @strapi/strapi@x` directly.

Follow the steps below in order.

## Step 1 — Determine current and target versions

1. Read the project's current Strapi version from `package.json` (`@strapi/strapi` under `dependencies`). If there is no Strapi project in the working directory, stop and tell the user.
2. Determine the latest published version:

   ```bash
   npm view @strapi/strapi dist-tags
   ```

   The `latest` tag is the newest stable release. `legacy` is typically the latest v4.

3. Establish the target. If the user named a version or release type (`major`/`minor`/`patch`/`latest`/a specific `x.y.z`), use it. Otherwise default to `latest` and confirm with the user.
4. Classify the jump using [semantic versioning](https://semver.org/): compare the major/minor/patch of current vs. target. **Only a change in the major number introduces breaking changes.** Minor and patch releases are backward-compatible by definition.

## Step 2 — Check breaking changes (MANDATORY, before any upgrade)

Use the `strapi-docs-mcp` skill / `strapi-docs` MCP server if it is available; otherwise fetch the docs directly. Do not skip this step even for patch upgrades.

### If the strapi-docs MCP server is available

Query it for the breaking changes between the current and target versions, e.g.:

> "What are the breaking changes when upgrading Strapi from `<current>` to `<target>`?"

Quote the exact breaking-change titles and note which are handled by codemods vs. which require manual work.

### If the MCP server is NOT available

Fetch the breaking changes page directly (no auth needed). Prefer the flat Markdown form:

- Major-version migrations (e.g. v4 → v5): `https://docs.strapi.io/cms/migration/v4-to-v5/breaking-changes.md`

Use `WebFetch` on the `.md` URL (append `.md` to any `docs.strapi.io` page to get flattened Markdown with nothing hidden in tabs/accordions). If a page 404s as `.md`, retry the HTML URL.

### Make the report concrete — scan the codebase

Do not stop at a generic list from the docs. For each breaking change, **grep the project's own source to see which ones actually apply**, and turn the summary into a project-specific list. Concretely:

- Read `src/index.{js,ts}` (the app's `register`/`bootstrap` entry) for patterns the breaking changes touch.
- Scan the project's controllers, services, and route files (`src/api/**`) — the upgrade tool's codemods cover common patterns, but custom logic often uses APIs a breaking change renames or removes.
- Read the content-type schemas (`src/api/**/content-types/**/schema.json` and `src/components/**`) for attributes affected by breaking changes — e.g. attribute types that changed, or attribute names that collide with new reserved/system names.
- Check `package.json` and `config/plugins.{js,ts}` for third-party plugins whose compatibility may be affected.

Use each breaking-change title as a search seed (grep for the removed/renamed API, the deprecated option, the reserved name). Report **which files match which breaking change** so the user sees exactly what the upgrade will touch versus what they'll need to fix by hand.

### Report and gate

- **Same major (minor/patch upgrade):** State clearly that there are **no breaking changes** — the breaking-changes database is scoped to major migrations only. You still performed the check; say so.
- **Major upgrade:** Summarize the applicable breaking changes grounded in the codebase scan above, flag which are handled by codemods versus which need manual code updates, call out any **reserved-name collisions** (these may need a database migration — see Step 7), and **stop and wait for the user's affirmative reply before proceeding — do not continue in the same turn.**

## Step 3 — Pre-flight safety

Remind the user to back up **codebase and database** before upgrading (default SQLite DB is `.tmp/data.db`). The upgrade tool also checks for a clean git working tree as an optional requirement, so a committed/clean tree eases rollback.

Offer a dry run first to preview changes without modifying files:

```bash
npx @strapi/upgrade <target> --dry
```

## Step 4 — Check the running Node version (before running the tool)

The `@strapi/upgrade` tool is itself a Node CLI: it runs under whatever Node `npx` is invoked with, and it declares the **same** Node requirement as the target Strapi. So the running Node — not just `package.json`'s `engines` — must satisfy the target's range **before** you run the tool. If it doesn't, both the upgrade run and the subsequent app boot happen on an unsupported runtime.

1. Read the currently running Node version (`node -v`).
2. Read the Node range the **target** Strapi supports:

   ```bash
   npm view @strapi/strapi@<target-x.y.z> engines
   ```

   (Cross-check against the docs' recommended Node for that major — Strapi recommends the active LTS.)

3. **If the running Node already satisfies the target's range**, continue to Step 5.
4. **If it does not, Node must be upgraded before the upgrade.** How you handle this depends on whether the user has a **Node version manager** — check for one before deciding (look for `nvm`, `fnm`, or `volta` on `PATH`, and for a `.nvmrc` / `.node-version` / Volta field in the repo):
   - **If a version manager is present:** **prompt the user to ask whether they want you to upgrade the Node version** for them, and gate on their confirmation before any runtime change. Only if they confirm:
     - Pick a Node version **inside the target's range**, preferring an LTS release the target lists.
     - Switch via their version manager (never a global install) so the change is reversible — the old Strapi can still run on the old Node if a rollback is needed. Suggest pinning it in the repo (`.nvmrc` / `.node-version` / Volta field) so CI and teammates move together.
   - **If no version manager is present:** do **not** attempt to change the system Node yourself — a global runtime swap is risky and not cleanly reversible. Instead, **tell the user to fix the Node version on their own**, and recommend they do it by **installing a version manager first** (`nvm`, `fnm`, or `volta`), then selecting a Node version inside the target's range. Stop and wait for them to sort the runtime out before continuing.
   - **Do not reinstall `node_modules` immediately after switching Node.** At that point `package.json` still pins the **old** Strapi, so a clean install would rebuild the _old_ dependency tree against the new Node — which, if the ranges are disjoint (below), can fail the `engines` check or leave native modules built against the wrong ABI, breaking the working state before the tool has moved you forward. The clean reinstall belongs **after** Step 5, once the tool has rewritten `package.json` to the target (see Step 7d).
   - **When the current and target Node ranges do not overlap at all** (e.g. current supports Node 18, target requires ≥20), a clean in-place swap isn't possible while staying on the old runtime. The safe ordering is: on the **old** Node, first get the current major to its **latest patch** (run `npx @strapi/upgrade minor`), so that step stays rollback-able; _then_ switch Node into the target's range; _then_ run the major upgrade in Step 5. Only after that upgrade run do you reinstall dependencies.

## Step 5 — Run the upgrade with the upgrade tool

Run the official tool from the project root. Choose the command form that matches the target:

```bash
npx @strapi/upgrade latest          # newest stable version
npx @strapi/upgrade major           # next major (requires being on latest patch of current major first)
npx @strapi/upgrade minor           # latest minor+patch in current major
npx @strapi/upgrade patch           # latest patch in current minor
npx @strapi/upgrade to <x.y.z>      # a specific published version
```

Notes:

- `major` is gated: the project must already be on the latest patch of its current major. If it isn't, run `minor` first, then `major`.
- Use `to <x.y.z>` when `latest` is blocked by a registry policy (e.g. `min-release-age` in `.npmrc`) or when the user wants an exact version. `to` skips the major-safety check intentionally.
- For pre-releases, add `--codemods-target <x.y.z>`.
- Useful flags: `-y/--yes` (auto-confirm prompts), `-d/--debug` (verbose), `-p/--project-path <path>` (non-cwd project). **Avoid `-y/--yes` for major jumps** — it auto-confirms *every* prompt, including the major-version safety prompt on `latest`. Prefer interactive mode (or explicit per-step user approval) unless the user asked for an unattended run.

The tool updates dependencies, installs them, and runs codemods for the target version. **Do not** substitute a manual `package.json` edit or a bare `npm install` for this step.

If the install phase fails (e.g. `ERESOLVE`), first retry with a **clean `node_modules` and lockfile** (`rm -rf node_modules package-lock.json && npm install`) before falling back to any manual dependency edits — a stale lockfile from the old major is the most common cause and a clean reinstall usually resolves it.

## Step 6 — Fix the `engines` field

The upgrade tool updates dependencies but **does not touch `package.json`'s `engines` field**. A stale `engines.node` range left over from the old major can fail the compatibility check and **block `install`** (`npm`/`yarn`/`pnpm`) after the upgrade. (This is the declared range in `package.json` — distinct from the _running_ Node you checked in Step 4.)

1. Read `engines` from the project's `package.json`.
2. Reuse the target's Node range from Step 4 (`npm view @strapi/strapi@<target-x.y.z> engines`).
3. If the project's `engines.node` is narrower than or incompatible with the target's, **offer to replace it** with the correct range for the target major, and apply the edit once the user confirms. Leave it alone if it's already compatible.

## Step 7 — Post-upgrade: codemod gaps, plugins, migrations

Run these in order. Each destructive or code-changing action **pauses for the user to confirm** — the user is in charge of every change beyond what the tool applied automatically.

### 7a — Review and offer to fix the codemod gaps

1. Tell the user to **review the changes** the tool made (especially codemod edits and `package.json`) before restarting the app.
2. Codemods cover common patterns, not everything. Cross-reference the breaking changes flagged as "manual" in Step 2 against the code the codemods actually changed. For anything still unhandled, **ask the user whether they want you to attempt the fixes** in application code — then **wait for their affirmative reply; do not start editing in the same turn.** Only edit code after they confirm, and edit _after_ the tool's codemods have been applied (never before — you'd fight the codemods).

### 7b — Upgrade incompatible third-party plugins

If any third-party plugin (from Step 2's `package.json`/`config/plugins` scan, or surfaced by install/boot errors) is **not compatible** with the target Strapi version:

1. Identify a plugin version that supports the target (`npm view <plugin> versions` / its peer-dependency range on `@strapi/strapi`).
2. **Ask the user before upgrading each plugin individually** — confirm every plugin bump separately; never batch-upgrade plugins silently.
3. Apply the confirmed version bump and reinstall.

### 7c — Reserved-name collisions → custom database migration

If Step 2 found an attribute whose name collides with a new **reserved/system name** in the target major, a rename is required and renaming a column risks data loss. In that case:

1. **Ask the user whether to proceed with the rename** at all.
2. If yes, **ask whether you should generate a database migration** to preserve existing data during the rename.
3. **Require an explicit backup confirmation before writing or running any migration.** The migration executes against the real database on next boot and the rename is not cleanly reversible, so ask the user to confirm **they have manually backed up the database** — then **stop and wait for a clear "yes" in a separate reply; do not continue in the same turn.** Do not proceed on a vague answer, and never take the backup on their behalf as a substitute for their confirmation. If they have not backed up, stop and let them do it first.
4. Only after that confirmation, author the migration following **[reference.md](reference.md)** (placement, ordering gotchas, data-safe rename, system-column collisions, idempotency, `down()`). Do not hand-wave this — the ordering and collision rules there prevent both boot failures and silent data loss.

### 7d — Verify

1. For major upgrades, note that Strapi's built-in data migrations run automatically on first startup in the new major — the upgrade tool does **not** migrate data itself, and any custom migration in `./database/migrations/` also runs then.
2. **If Node was switched in Step 4, do a clean reinstall now** — after the tool has rewritten `package.json` to the target, not before: `rm -rf node_modules && install`. Native modules (`better-sqlite3`, `sharp`, …) are compiled against a specific Node ABI; a stale build left over from the old Node is the most common "changed Node and it won't boot" failure and is easily misread as an upgrade bug.
3. Verify: reinstall if needed, rebuild the admin, and start the app to confirm it boots cleanly.

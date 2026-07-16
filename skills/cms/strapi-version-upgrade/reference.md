# Reference — custom database migrations for reserved-name renames

When a Strapi major upgrade introduces a reserved/system name that collides with an existing user-defined attribute, you must rename the attribute. Renaming a column risks data loss, so a hand-written database migration is the data-safe path. This reference covers how to write one correctly.

> **Backup first — confirm it explicitly.** Migrations execute against the real database on next boot and this rename is not cleanly reversible. Before writing or running the migration, **ask the user to confirm they have manually backed up the database, and wait for a clear "yes".** Do not proceed on a vague answer, and do not treat a backup you take as a substitute for their confirmation. For the default SQLite database the file is `.tmp/data.db`; for other databases use the appropriate dump tool. A committed, clean git tree makes rollback of code trivial.

## Placement & mechanics

- Put migration files in `./database/migrations/`. Strapi auto-runs any `.js` file there on startup, in **filename order** — so timestamp-prefix the name so it sorts correctly, e.g. `2026.07.15T00.00.00.rename-reserved-attribute.js`.
- TypeScript projects: `.js` migrations in `./database/migrations/` work with the default (no config). Only set `database.settings.useTypescriptMigrations: true` if you author migrations as `.ts` files and want Strapi to load the compiled output from `dist/`.
- Export `async up(knex)` and `async down(knex)`. Strapi passes a raw **Knex** instance: use `knex.schema` for DDL and `knex('table')` for data.
- Completed runs are recorded in the `strapi_migrations` table **by filename**. Strapi skips any filename already listed there — it does **not** diff file contents. Never edit a migration after it has run on an environment; add a new one.

## Ordering: the critical gotcha

- Files in `./database/migrations/` run **before** Strapi's automatic schema-sync and before its built-in internal migrations (e.g. `discard-drafts`).
- Consequence: **do not rely on schema-sync to create your new columns.** If a built-in migration references a column your rename introduces, that column must already physically exist at the time it runs. So **create or rename the columns yourself inside `up()`** rather than only editing `schema.json` and expecting sync to catch up.

## Preserving data on rename

- Prefer a true rename — it keeps every existing value in place (rename, not drop + recreate):

  ```js
  await knex.schema.alterTable('table_name', (t) => {
    t.renameColumn('old_col', 'new_col');
  });
  ```

- **Snake-case the mapping.** Strapi stores attributes as snake_cased columns: attribute `workflowStatus` → column `workflow_status`; `externalId` → `external_id`. Map attribute names to column names before writing any SQL.
- If you must copy instead of rename, copy **conditionally** so a re-run never clobbers already-migrated data:

  ```sql
  UPDATE table_name SET new_col = old_col
  WHERE new_col IS NULL AND old_col IS NOT NULL;
  ```

## Watch for collisions with system columns

- Some old user attributes collide with a **system** column introduced by the new major (for example a v4 `documentId` attribute maps to `document_id`, which is also v5's system identifier column). You **cannot** rename or drop a system column — it belongs to Strapi.
- Resolution: **inspect the real data first.** If the old user column is entirely empty, there is nothing to preserve — create the new column empty rather than renaming from the colliding system column. If it holds data, copy it into a differently-named new column (never onto the system column) with the conditional-copy pattern above.

## Idempotency & safety

- Guard every step with existence checks so the migration is safe to re-run and tolerates whatever partial state a prior failed boot left behind:

  ```js
  if (await knex.schema.hasTable('table_name')) {
    const hasOld = await knex.schema.hasColumn('table_name', 'old_col');
    const hasNew = await knex.schema.hasColumn('table_name', 'new_col');
    if (hasOld && !hasNew) {
      await knex.schema.alterTable('table_name', (t) => t.renameColumn('old_col', 'new_col'));
    }
  }
  ```

- **Verify against the actual database before writing SQL.** Do not assume the schema — check it. For SQLite: `PRAGMA table_info(<table>);`, plus row counts and a few sample rows. Use the equivalent inspection for other databases.

## `down()`

- A destructive rename generally can't be cleanly auto-reversed. A no-op `down()` with a comment pointing to "restore from backup" is honest and safe — don't fake a reversal that could lose data:

  ```js
  async function down() {
    // No safe automatic reversal for this rename. Restore from the pre-migration backup.
  }
  ```

## Minimal template

```js
'use strict';

async function up(knex) {
  // 1. Verify the table exists and inspect current columns before touching anything.
  if (!(await knex.schema.hasTable('table_name'))) return;

  const hasOld = await knex.schema.hasColumn('table_name', 'old_col');
  const hasNew = await knex.schema.hasColumn('table_name', 'new_col');

  // 2. Data-safe rename, guarded for idempotency.
  if (hasOld && !hasNew) {
    await knex.schema.alterTable('table_name', (t) => t.renameColumn('old_col', 'new_col'));
  }
}

async function down() {
  // No safe automatic reversal. Restore from the pre-migration backup.
}

module.exports = { up, down };
```

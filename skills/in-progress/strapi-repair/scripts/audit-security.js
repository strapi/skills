'use strict';

/**
 * Read-only security defaults audit (PR #26737 / CMS-250).
 * Run from the Strapi application root: node scripts/audit-security.js
 *
 * Source: https://github.com/strapi/strapi/pull/26737
 */

const fs = require('fs');
const path = require('path');

const root = process.cwd();

function readIfExists(relPaths) {
  for (const rel of relPaths) {
    const full = path.join(root, rel);
    if (fs.existsSync(full)) {
      return { path: rel, content: fs.readFileSync(full, 'utf8') };
    }
  }
  return null;
}

function check(content, pattern) {
  return pattern.test(content);
}

const api = readIfExists(['config/api.ts', 'config/api.js']);
const plugins = readIfExists(['config/plugins.ts', 'config/plugins.js']);
const server = readIfExists(['config/server.ts', 'config/server.js']);
const envFile = readIfExists(['.env']);

const checks = [
  {
    id: 'api.rest.strictParams',
    breaking: true,
    present: api ? check(api.content, /rest\s*:\s*\{[^}]*strictParams\s*:\s*true/s) : false,
    file: api?.path,
  },
  {
    id: 'api.documents.strictParams',
    breaking: true,
    present: api ? check(api.content, /documents\s*:\s*\{[^}]*strictParams\s*:\s*true/s) : false,
    file: api?.path,
  },
  {
    id: 'users-permissions.jwtManagement.refresh',
    breaking: true,
    present: plugins
      ? check(plugins.content, /jwtManagement\s*:\s*['"]refresh['"]/)
      : false,
    file: plugins?.path,
  },
  {
    id: 'users-permissions.sessions.httpOnly',
    breaking: true,
    present: plugins ? check(plugins.content, /httpOnly\s*:\s*true/) : false,
    file: plugins?.path,
  },
  {
    id: 'upload.security.allowedTypes',
    breaking: true,
    present: plugins ? check(plugins.content, /allowedTypes\s*:/) : false,
    file: plugins?.path,
  },
  {
    id: 'upload.security.deniedTypes',
    breaking: true,
    present: plugins ? check(plugins.content, /deniedTypes\s*:/) : false,
    file: plugins?.path,
  },
  {
    id: 'server.webhooks.populateRelations.false',
    breaking: false,
    present: server
      ? check(server.content, /populateRelations\s*:\s*false/) ||
        check(server.content, /WEBHOOKS_POPULATE_RELATIONS.*false/)
      : false,
    file: server?.path,
  },
  {
    id: 'env.JWT_SECRET',
    breaking: false,
    present: envFile ? /^JWT_SECRET=.+/m.test(envFile.content) : false,
    file: envFile?.path,
  },
];

const missing = checks.filter((c) => !c.present);
const missingBreaking = missing.filter((c) => c.breaking);
const missingSafe = missing.filter((c) => !c.breaking);

console.log(
  JSON.stringify(
    {
      source: 'https://github.com/strapi/strapi/pull/26737',
      filesRead: {
        api: api?.path || null,
        plugins: plugins?.path || null,
        server: server?.path || null,
        env: envFile ? '.env' : null,
      },
      summary: {
        total: checks.length,
        present: checks.length - missing.length,
        missing: missing.length,
        missingBreaking: missingBreaking.length,
        missingSafe: missingSafe.length,
      },
      checks,
      recommendation:
        missingBreaking.length > 0
          ? 'Report missing breaking items to the user; apply only with explicit approval.'
          : missingSafe.length > 0
            ? 'Safe items can be applied (JWT_SECRET, webhooks.populateRelations).'
            : 'All audited defaults appear present.',
    },
    null,
    2
  )
);

'use strict';

/**
 * Pre-flight checks before setupStrapi().
 * Copy to tests/verify-test-env.js in the user project.
 *
 * Usage (from project root):
 *   NODE_ENV=test node tests/verify-test-env.js
 */

const fs = require('fs');
const path = require('path');

const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

const nodeEnv = process.env.NODE_ENV;
if (nodeEnv !== 'test') {
  fail(`NODE_ENV must be "test" (got "${nodeEnv || 'undefined'}"). Run via: yarn test`);
}

const testDbConfig = path.join(process.cwd(), 'config', 'env', 'test', 'database.js');
if (!fs.existsSync(testDbConfig)) {
  fail(
    `Missing ${testDbConfig} — copy from https://docs.strapi.io/cms/testing#set-up-a-testing-environment`
  );
}

const client = process.env.DATABASE_CLIENT || 'sqlite';

if (client === 'sqlite') {
  const filename = process.env.DATABASE_FILENAME || '.tmp/test.db';
  if (filename !== ':memory:' && !filename.includes('.tmp') && !filename.includes('test')) {
    warn(
      `SQLite test DB path "${filename}" is outside .tmp/ — ensure it is not your dev database file.`
    );
  }
} else {
  const dbName = process.env.DATABASE_NAME || '';
  if (!/test/i.test(dbName)) {
    fail(
      `DATABASE_NAME "${dbName}" must contain "test" for non-SQLite test databases, or use SQLite for local tests.`
    );
  }
}

const prodHostPatterns = [/prod/i, /production/i, /\.rds\./i, /azure/i];
const host = process.env.DATABASE_HOST || '';
for (const pattern of prodHostPatterns) {
  if (pattern.test(host)) {
    fail(`DATABASE_HOST "${host}" looks like production. Use a dedicated test host.`);
  }
}

if (warnings.length) {
  console.warn('verify-test-env warnings:');
  warnings.forEach((w) => console.warn(`  - ${w}`));
}

if (errors.length) {
  console.error('verify-test-env failed:');
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

console.log('verify-test-env: OK');

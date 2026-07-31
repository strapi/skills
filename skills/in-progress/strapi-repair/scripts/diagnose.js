'use strict';

/**
 * Read-only Strapi project diagnostics (environment facts only).
 * Does not parse or audit config source — use the security checklist in SKILL.md for that.
 * Run from the Strapi application root: node scripts/diagnose.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = process.cwd();

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
  } catch {
    return null;
  }
}

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

function detectPackageManager() {
  if (exists('pnpm-lock.yaml')) return 'pnpm';
  if (exists('yarn.lock')) return 'yarn';
  if (exists('package-lock.json')) return 'npm';
  if (exists('bun.lockb') || exists('bun.lock')) return 'bun';
  return 'unknown';
}

function envKeysPresent() {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return { file: false, keys: [] };
  const content = fs.readFileSync(envPath, 'utf8');
  const keys = [
    'APP_KEYS',
    'API_TOKEN_SALT',
    'ADMIN_JWT_SECRET',
    'JWT_SECRET',
    'DATABASE_CLIENT',
  ];
  return {
    file: true,
    keys: keys.map((k) => ({ name: k, present: new RegExp(`^${k}=`, 'm').test(content) })),
  };
}

const pkg = readJson('package.json') || {};
const pm = detectPackageManager();
const strapiVersion =
  pkg.dependencies?.['@strapi/strapi'] || pkg.devDependencies?.['@strapi/strapi'] || 'not found';

const report = {
  cwd: root,
  node: process.version,
  packageManager: pm,
  packageManagerVersion: pm === 'pnpm' ? run('pnpm -v') : pm === 'yarn' ? run('yarn -v') : pm === 'npm' ? run('npm -v') : null,
  strapiVersion,
  paths: {
    dist: exists('dist'),
    dotStrapi: exists('.strapi'),
    dotStrapiClient: exists('.strapi/client'),
    dotCache: exists('.cache'),
    dotTmp: exists('.tmp'),
    configEnvTest: exists('config/env/test'),
    pnpmWorkspaceYaml: exists('pnpm-workspace.yaml'),
  },
  adminPeerDeps: ['react', 'react-dom', 'styled-components', 'react-router-dom'].map((dep) => ({
    name: dep,
    declared: Boolean(pkg.dependencies?.[dep] || pkg.devDependencies?.[dep]),
  })),
  env: envKeysPresent(),
};

const warnings = [];

if (pm === 'pnpm' && !report.paths.pnpmWorkspaceYaml) {
  const major = parseInt(report.packageManagerVersion || '0', 10);
  if (major >= 11) {
    warnings.push('pnpm 11+ expects pnpm-workspace.yaml — see https://pnpm.io/migration');
  }
}

if (report.paths.dist) {
  warnings.push('dist/ exists — can shadow config in some setups; see docs.strapi.io/cms/testing');
}

const missingPeers = report.adminPeerDeps.filter((d) => !d.declared);
if (missingPeers.length) {
  warnings.push(
    `Admin peer deps not in package.json: ${missingPeers.map((d) => d.name).join(', ')} — strapi build may fail`
  );
}

console.log(JSON.stringify({ ...report, warnings }, null, 2));

'use strict';

/**
 * Strapi test harness for projects with JavaScript/JSON config only.
 *
 * If config/ uses TypeScript (.ts, .mts, .cts), use the full harness from:
 * https://docs.strapi.io/cms/testing#create-the-strapi-test-harness
 *
 * Do not pass distDir — load from source so config/env/test/ is respected.
 */

const fs = require('fs');
const path = require('path');
const { createStrapi } = require('@strapi/strapi');

if (typeof jest !== 'undefined' && typeof jest.setTimeout === 'function') {
  jest.setTimeout(30000);
}

process.env.NODE_ENV = 'test';
process.env.APP_KEYS = process.env.APP_KEYS || 'testKeyOne,testKeyTwo';
process.env.API_TOKEN_SALT = process.env.API_TOKEN_SALT || 'test-api-token-salt';
process.env.ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'test-admin-jwt-secret';
process.env.TRANSFER_TOKEN_SALT = process.env.TRANSFER_TOKEN_SALT || 'test-transfer-token-salt';
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.DATABASE_CLIENT = process.env.DATABASE_CLIENT || 'sqlite';
process.env.DATABASE_FILENAME = process.env.DATABASE_FILENAME || '.tmp/test.db';
process.env.STRAPI_DISABLE_CRON = 'true';
process.env.PORT = process.env.PORT || '0';

const databaseClient = process.env.DATABASE_CLIENT;
const driverMap = {
  sqlite: 'sqlite3',
  'better-sqlite3': 'sqlite3',
  mysql: 'mysql2',
  postgres: 'pg',
};

const driver = driverMap[databaseClient];
if (!driver) {
  throw new Error(`Unsupported DATABASE_CLIENT "${databaseClient}" for tests.`);
}
if (databaseClient === 'better-sqlite3') {
  process.env.DATABASE_CLIENT = 'sqlite';
}
require(driver);

let instance;

async function setupStrapi() {
  if (!instance) {
    const dbFile = process.env.DATABASE_FILENAME;
    if (
      process.env.DATABASE_CLIENT === 'sqlite' &&
      dbFile &&
      dbFile !== ':memory:' &&
      fs.existsSync(dbFile)
    ) {
      fs.unlinkSync(dbFile);
    }

    instance = await createStrapi().load();
    await instance.server.mount();
    global.strapi = instance;

    const userService = instance.plugins['users-permissions']?.services?.user;
    if (userService && !userService.__testRolePatch) {
      const originalAdd = userService.add.bind(userService);
      userService.add = async (values) => {
        const data = { ...values };
        if (!data.role) {
          const defaultRole = await instance.db
            .query('plugin::users-permissions.role')
            .findOne({ where: { type: 'authenticated' } });
          if (defaultRole) {
            data.role = defaultRole.id;
          }
        }
        return originalAdd(data);
      };
      userService.__testRolePatch = true;
    }
  }
  return instance;
}

async function cleanupStrapi() {
  const active = instance || global.strapi;
  if (!active) {
    return;
  }

  if (active.server?.httpServer) {
    await new Promise((resolve) => active.server.httpServer.close(resolve));
  }
  if (active.db?.connection) {
    await active.db.connection.destroy();
  }
  if (typeof active.destroy === 'function') {
    await active.destroy();
  }

  const dbSettings = active.config?.get('database.connection');
  const filename = dbSettings?.connection?.filename;
  if (filename && filename !== ':memory:' && fs.existsSync(filename)) {
    fs.unlinkSync(filename);
  }

  instance = null;
  global.strapi = undefined;
}

module.exports = { setupStrapi, cleanupStrapi };

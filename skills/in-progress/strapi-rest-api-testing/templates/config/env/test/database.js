'use strict';

/**
 * Isolated test database — loaded when NODE_ENV=test.
 * Default: SQLite file under .tmp/ (never the dev database).
 *
 * Override via env vars (set in tests/strapi.js or CI):
 *   DATABASE_CLIENT, DATABASE_FILENAME
 *
 * See REFERENCE.md in strapi-rest-api-testing for Postgres/MySQL options.
 */
module.exports = ({ env }) => {
  const rawClient = env('DATABASE_CLIENT', 'sqlite');
  const client = ['sqlite3', 'better-sqlite3'].includes(rawClient) ? 'sqlite' : rawClient;

  if (client === 'sqlite') {
    const filename = env('DATABASE_FILENAME', '.tmp/test.db');
    return {
      connection: {
        client: 'sqlite',
        connection: { filename },
        useNullAsDefault: true,
      },
    };
  }

  if (client === 'postgres') {
    return {
      connection: {
        client: 'postgres',
        connection: {
          host: env('DATABASE_HOST', '127.0.0.1'),
          port: env.int('DATABASE_PORT', 5432),
          database: env('DATABASE_NAME', 'strapi_test'),
          user: env('DATABASE_USERNAME', 'strapi'),
          password: env('DATABASE_PASSWORD', 'strapi'),
        },
      },
    };
  }

  if (client === 'mysql') {
    return {
      connection: {
        client: 'mysql',
        connection: {
          host: env('DATABASE_HOST', '127.0.0.1'),
          port: env.int('DATABASE_PORT', 3306),
          database: env('DATABASE_NAME', 'strapi_test'),
          user: env('DATABASE_USERNAME', 'strapi'),
          password: env('DATABASE_PASSWORD', 'strapi'),
        },
      },
    };
  }

  throw new Error(
    `Unsupported test DATABASE_CLIENT "${rawClient}". Use sqlite (default), postgres, or mysql.`
  );
};

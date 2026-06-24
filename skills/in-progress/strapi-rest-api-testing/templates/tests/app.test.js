const request = require('supertest');
const { setupStrapi, cleanupStrapi } = require('./strapi');

/**
 * Smoke test — proves the harness boots Strapi and serves HTTP.
 * Must pass before writing endpoint-specific tests.
 *
 * GET /_health is registered by Strapi core (returns 204).
 */
describe('Strapi test harness', () => {
  beforeAll(async () => {
    await setupStrapi();
  });

  afterAll(async () => {
    await cleanupStrapi();
  });

  it('strapi instance is defined', () => {
    expect(strapi).toBeDefined();
    expect(strapi.server.httpServer).toBeDefined();
  });

  it('GET /_health returns 204', async () => {
    await request(strapi.server.httpServer).get('/_health').expect(204);
  });
});

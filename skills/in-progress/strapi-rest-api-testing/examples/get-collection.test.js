const request = require('supertest');
const { setupStrapi, cleanupStrapi } = require('../strapi');
const { grantPublicPermissions } = require('../helpers/permissions');

/**
 * Example: test a collection-type list endpoint.
 * Replace api::article.article and /api/articles with the project's content type.
 */
describe('GET /api/articles', () => {
  beforeAll(async () => {
    await setupStrapi();
    await grantPublicPermissions(strapi, ['api::article.article.find']);
  });

  afterAll(async () => {
    await cleanupStrapi();
  });

  it('returns 200 and only published articles', async () => {
    await strapi.documents('api::article.article').create({
      data: { title: 'Published', slug: 'published' },
      status: 'published',
    });
    await strapi.documents('api::article.article').create({
      data: { title: 'Draft', slug: 'draft' },
      status: 'draft',
    });

    const res = await request(strapi.server.httpServer).get('/api/articles').expect(200);

    expect(res.body.data).toEqual(expect.any(Array));
    const titles = res.body.data.map((entry) => entry.title);
    expect(titles).toContain('Published');
    expect(titles).not.toContain('Draft');
  });
});

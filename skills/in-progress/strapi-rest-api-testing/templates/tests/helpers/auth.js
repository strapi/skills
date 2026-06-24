'use strict';

const request = require('supertest');

/**
 * Create a local user and return { jwt, user } via /api/auth/local.
 * Requires users-permissions plugin and harness user.add role patch.
 *
 * @param {import('@strapi/strapi').Core.Strapi} strapi
 * @param {object} [credentials]
 */
async function loginAsUser(
  strapi,
  credentials = {
    username: 'tester',
    email: 'tester@strapi.test',
    password: 'Test1234abc',
    provider: 'local',
    confirmed: true,
  }
) {
  await strapi.plugins['users-permissions'].services.user.add({ ...credentials });

  const res = await request(strapi.server.httpServer)
    .post('/api/auth/local')
    .set('Content-Type', 'application/json')
    .send({
      identifier: credentials.email,
      password: credentials.password,
    })
    .expect(200);

  if (!res.body.jwt) {
    throw new Error('loginAsUser: expected jwt in response');
  }

  return { jwt: res.body.jwt, user: res.body.user };
}

module.exports = { loginAsUser };

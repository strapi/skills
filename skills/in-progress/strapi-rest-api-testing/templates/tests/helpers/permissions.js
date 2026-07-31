'use strict';

/**
 * Grant users-permissions actions to a role (usually Public or Authenticated).
 *
 * @param {import('@strapi/strapi').Core.Strapi} strapi
 * @param {'public' | 'authenticated'} roleType
 * @param {string[]} actions - e.g. ['api::article.article.find', 'api::article.article.findOne']
 */
async function grantRolePermissions(strapi, roleType, actions) {
  const role = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: roleType },
  });

  if (!role) {
    throw new Error(`users-permissions role "${roleType}" not found`);
  }

  for (const action of actions) {
    const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
      where: { action, role: role.id },
    });

    if (!existing) {
      await strapi.db.query('plugin::users-permissions.permission').create({
        data: { action, role: role.id },
      });
    }
  }
}

async function grantPublicPermissions(strapi, actions) {
  return grantRolePermissions(strapi, 'public', actions);
}

async function grantAuthenticatedPermissions(strapi, actions) {
  return grantRolePermissions(strapi, 'authenticated', actions);
}

module.exports = {
  grantRolePermissions,
  grantPublicPermissions,
  grantAuthenticatedPermissions,
};

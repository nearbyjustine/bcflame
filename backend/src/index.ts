export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    // Set up permissions for authenticated users
    const authenticatedRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: { type: 'authenticated' },
    });

    if (authenticatedRole) {
      // Define permissions for order-inquiry
      const orderInquiryPermissions = [
        { action: 'api::order-inquiry.order-inquiry.create' },
        { action: 'api::order-inquiry.order-inquiry.find' },
        { action: 'api::order-inquiry.order-inquiry.findOne' },
        { action: 'api::order-inquiry.order-inquiry.batch' },
      ];

      for (const perm of orderInquiryPermissions) {
        const existingPermission = await strapi.query('plugin::users-permissions.permission').findOne({
          where: {
            action: perm.action,
            role: authenticatedRole.id,
          },
        });

        if (!existingPermission) {
          await strapi.query('plugin::users-permissions.permission').create({
            data: {
              action: perm.action,
              role: authenticatedRole.id,
            },
          });
          strapi.log.info(`✅ Created permission: ${perm.action} for authenticated role`);
        }
      }
    }
  },
};

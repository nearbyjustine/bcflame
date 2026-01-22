import { initializeSocket } from './socket';

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
    // Initialize Socket.IO when Strapi server starts
    const httpServer = strapi.server.httpServer;
    const io = initializeSocket(httpServer);

    // Store io instance globally for access in controllers
    strapi.io = io;

    console.log('✅ Socket.IO server initialized');
    // Set up permissions for authenticated users
    const authenticatedRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: { type: 'authenticated' },
    });

    if (authenticatedRole) {
      // Define permissions for order-inquiry, conversation, and message
      const permissions = [
        // Order Inquiry
        { action: 'api::order-inquiry.order-inquiry.create' },
        { action: 'api::order-inquiry.order-inquiry.find' },
        { action: 'api::order-inquiry.order-inquiry.findOne' },
        { action: 'api::order-inquiry.order-inquiry.batch' },
        // Conversation
        { action: 'api::conversation.conversation.find' },
        { action: 'api::conversation.conversation.findOne' },
        { action: 'api::conversation.conversation.create' },
        { action: 'api::conversation.conversation.update' },
        { action: 'api::conversation.conversation.delete' },
        { action: 'api::conversation.conversation.findOrCreate' },
        { action: 'api::conversation.conversation.markAsRead' },
        { action: 'api::conversation.conversation.getUnreadCount' },
        // Message
        { action: 'api::message.message.find' },
        { action: 'api::message.message.findOne' },
        { action: 'api::message.message.create' },
        { action: 'api::message.message.update' },
        { action: 'api::message.message.delete' },
      ];

      for (const perm of permissions) {
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

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
    // Validate critical environment variables in production
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv === 'production') {
      const requiredEnvVars = ['DATABASE_PASSWORD', 'JWT_SECRET', 'ADMIN_JWT_SECRET', 'APP_KEYS'];
      const missingVars = requiredEnvVars.filter(varName => {
        if (varName === 'DATABASE_PASSWORD') {
          return !process.env.DATABASE_PASSWORD && !process.env.DB_PASSWORD;
        }
        return !process.env[varName];
      });

      if (missingVars.length > 0) {
        throw new Error(
          `CRITICAL: Missing required environment variables in production: ${missingVars.join(', ')}\n` +
          'Application cannot start without these variables.'
        );
      }
    }

    // Initialize Socket.IO when Strapi server starts
    const httpServer = strapi.server.httpServer;
    const io = initializeSocket(httpServer);

    // Store io instance globally for access in controllers
    strapi.io = io;

    strapi.log.info('✅ Socket.IO server initialized');
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
        // Notification
        { action: 'api::notification.notification.find' },
        { action: 'api::notification.notification.findOne' },
        { action: 'api::notification.notification.update' },
        { action: 'api::notification.notification.getUnread' },
        { action: 'api::notification.notification.getUnreadCount' },
        { action: 'api::notification.notification.markAllAsRead' },
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

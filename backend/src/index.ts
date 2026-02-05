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

    // Register onboarding route directly on the Koa router.
    // plugin.routes['content-api'] on users-permissions doesn't work because
    // the plugin's internal router shadows /users/* paths, causing 405s.
    const VALID_MODULE_KEYS = [
      'dashboard', 'products', 'orders', 'messages', 'media-hub',
      'admin-dashboard', 'admin-orders', 'admin-products', 'admin-users', 'admin-media', 'admin-messages',
    ];

    strapi.server.router.post('/api/users/onboarding/complete', async (ctx) => {
      const authHeader = ctx.request.header.authorization;
      if (!authHeader) {
        ctx.status = 401;
        ctx.body = { data: null, error: { status: 401, name: 'UnauthorizedError', message: 'No authorization token was found' } };
        return;
      }

      const token = authHeader.replace('Bearer ', '');
      let user;
      try {
        const jwtService = strapi.plugin('users-permissions').service('jwt');
        const decoded = await jwtService.verify(token);
        user = await strapi.query('plugin::users-permissions.user').findOne({
          where: { id: decoded.id },
        });
      } catch {
        ctx.status = 401;
        ctx.body = { data: null, error: { status: 401, name: 'UnauthorizedError', message: 'Invalid token' } };
        return;
      }

      if (!user) {
        ctx.status = 401;
        ctx.body = { data: null, error: { status: 401, name: 'UnauthorizedError', message: 'Invalid token: user not found' } };
        return;
      }

      const { moduleKey } = ctx.request.body;

      if (!moduleKey || !VALID_MODULE_KEYS.includes(moduleKey)) {
        ctx.status = 400;
        ctx.body = { data: null, error: { status: 400, name: 'BadRequestError', message: 'moduleKey is required and must be a valid module key' } };
        return;
      }

      const currentProgress = user.onboarding_progress || {};

      if (currentProgress[moduleKey]?.completed) {
        ctx.body = { success: true, onboarding_progress: currentProgress };
        return;
      }

      const updatedProgress = {
        ...currentProgress,
        [moduleKey]: {
          completed: true,
          completedAt: new Date().toISOString(),
        },
      };

      await strapi.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: { onboarding_progress: updatedProgress },
      });

      ctx.body = { success: true, onboarding_progress: updatedProgress };
    });

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

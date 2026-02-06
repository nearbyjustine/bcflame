import utils from "@strapi/utils";
const { sanitize } = utils;

const sanitizeUser = (user: any, ctx: any) => {
  const { auth } = ctx.state;
  const userSchema = strapi.getModel("plugin::users-permissions.user");
  return sanitize.contentAPI.output(user, userSchema, { auth });
};

export default (plugin: any) => {
  // Override the JWT callback to include userType in the token
  plugin.services.jwt.issue = (payload: any, jwtOptions = {}) => {
    const secret = strapi.config.get("plugin.users-permissions.jwtSecret");
    return strapi.plugins["users-permissions"].services.jwt.sign(
      payload,
      secret,
      jwtOptions
    );
  };

  // Override the callback controller to include userType in JWT
  const originalCallback = plugin.controllers.auth.callback;
  plugin.controllers.auth.callback = async (ctx: any) => {
    const provider = ctx.params.provider || "local";
    const params = ctx.request.body;

    const store = strapi.store({ type: "plugin", name: "users-permissions" });
    const grantSettings: any = await store.get({ key: "grant" });
    const grantProvider = provider === "local" ? "email" : provider;

    if (!grantSettings[grantProvider]?.enabled) {
      throw new utils.errors.ApplicationError("This provider is disabled");
    }

    if (provider === "local") {
      const { identifier, password } = params;

      if (!identifier || !password) {
        throw new utils.errors.ValidationError("identifier and password are required");
      }

      const user = await strapi
        .query("plugin::users-permissions.user")
        .findOne({
          where: {
            $or: [
              { email: identifier.toLowerCase() },
              { username: identifier },
            ],
          },
        });

      if (!user) {
        throw new utils.errors.ValidationError("Invalid identifier or password");
      }

      if (!user.password) {
        throw new utils.errors.ValidationError("Invalid identifier or password");
      }

      const validPassword = await strapi
        .plugin("users-permissions")
        .service("user")
        .validatePassword(password, user.password);

      if (!validPassword) {
        throw new utils.errors.ValidationError("Invalid identifier or password");
      }

      const advancedSettings: any = await store.get({ key: "advanced" });
      const requiresConfirmation = advancedSettings.email_confirmation;

      if (requiresConfirmation && !user.confirmed) {
        throw new utils.errors.ApplicationError("Your account email is not confirmed");
      }

      if (user.blocked) {
        throw new utils.errors.ApplicationError("Your account has been blocked by an administrator");
      }

      // Issue JWT with userType included in payload
      const jwt = strapi
        .plugin("users-permissions")
        .service("jwt")
        .issue({
          id: user.id,
          userType: user.userType || "reseller",
        });

      const sanitizedUser = await sanitizeUser(user, ctx);

      ctx.body = {
        jwt,
        user: sanitizedUser,
      };
    } else {
      // For non-local providers, use the original callback
      await originalCallback(ctx);
    }
  };

  // Add bulk update controller for user management
  plugin.controllers.user.bulkUpdate = async (ctx: any) => {
    const user = ctx.state.user;

    // Verify admin role
    if (user?.userType !== 'admin') {
      return ctx.forbidden('Only admins can bulk update users');
    }

    const { userIds, action } = ctx.request.body;

    // Validation
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return ctx.badRequest('userIds must be a non-empty array');
    }

    if (userIds.length > 100) {
      return ctx.badRequest('Cannot update more than 100 users at once');
    }

    const validActions = ['approve', 'block', 'unblock'];
    if (!validActions.includes(action)) {
      return ctx.badRequest('Invalid action. Must be one of: ' + validActions.join(', '));
    }

    try {
      const updates = [];
      const errors = [];

      for (const id of userIds) {
        try {
          const updateData: any = {};

          if (action === 'approve') {
            updateData.confirmed = true;
            updateData.blocked = false;
          } else if (action === 'block') {
            updateData.blocked = true;
          } else if (action === 'unblock') {
            updateData.blocked = false;
          }

          const updated = await strapi.query('plugin::users-permissions.user').update({
            where: { id },
            data: updateData,
          });

          updates.push({
            id,
            success: true,
            email: updated.email,
          });

          strapi.log.info(`✅ Bulk user update: User ${id} ${action}d successfully`);
        } catch (error) {
          const errorMessage = error.message || 'Unknown error';
          errors.push({ id, error: errorMessage });
          strapi.log.error(`❌ Bulk user update: Failed to update user ${id}:`, errorMessage);
        }
      }

      strapi.log.info(`Bulk user update completed: ${updates.length} success, ${errors.length} failed`);

      return {
        success: true,
        updated: updates.length,
        failed: errors.length,
        details: {
          updates,
          errors,
        },
      };
    } catch (error) {
      strapi.log.error('Bulk user update error:', error);
      return ctx.internalServerError('Bulk update failed');
    }
  };

  // Add user statistics controller
  plugin.controllers.user.statistics = async (ctx: any) => {
    const user = ctx.state.user;

    // Verify admin role
    if (user?.userType !== 'admin') {
      return ctx.forbidden('Only admins can view user statistics');
    }

    try {
      // Total users
      const total = await strapi.db.query('plugin::users-permissions.user').count();

      // Users by type
      const admins = await strapi.db.query('plugin::users-permissions.user').count({
        where: { userType: 'admin' },
      });

      const resellers = await strapi.db.query('plugin::users-permissions.user').count({
        where: { userType: 'reseller' },
      });

      // Users by status
      const confirmed = await strapi.db.query('plugin::users-permissions.user').count({
        where: { confirmed: true },
      });

      const blocked = await strapi.db.query('plugin::users-permissions.user').count({
        where: { blocked: true },
      });

      const pending = await strapi.db.query('plugin::users-permissions.user').count({
        where: { confirmed: false, blocked: false },
      });

      return {
        data: {
          total,
          byType: {
            admins,
            resellers,
          },
          byStatus: {
            confirmed,
            blocked,
            pending,
          },
        },
      };
    } catch (error) {
      strapi.log.error('User statistics error:', error);
      return ctx.internalServerError('Failed to fetch user statistics');
    }
  };

  // Add custom route for user statistics
  plugin.routes['content-api'].routes.unshift({
    method: 'GET',
    path: '/users/statistics',
    handler: 'user.statistics',
    config: {
      policies: [],
      middlewares: ['global::require-auth'],
    },
  });

  // Add custom route for bulk update
  plugin.routes['content-api'].routes.unshift({
    method: 'POST',
    path: '/users/bulk-update',
    handler: 'user.bulkUpdate',
    config: {
      policies: [],
      middlewares: ['global::require-auth'],
    },
  });

  return plugin;
};

/**
 * notification controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::notification.notification' as any, ({ strapi }) => ({
  /**
   * Get unread count for the current user
   */
  async getUnreadCount(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    try {
      // Build filter based on user type
      const where: any = {
        isRead: false,
      };

      // Admin users see all notifications without recipient OR with their adminUser ID
      if (user.userType === 'admin') {
        where.$or = [
          { recipient: null }, // Global notifications
          { adminUser: user.id },
        ];
      } else {
        // Reseller users see only their own notifications
        where.recipient = user.id;
      }

      const unreadCount = await strapi.db.query('api::notification.notification').count({
        where,
      });

      return {
        data: {
          count: unreadCount,
        },
      };
    } catch (error) {
      strapi.log.error('Get unread count error', {
        error: error.message,
        stack: error.stack,
        userId: user.id,
        correlationId: ctx.state.correlationId,
      });
      return ctx.internalServerError('Failed to retrieve unread notifications');
    }
  },

  /**
   * Get unread notifications and count for the current user
   */
  async getUnread(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    try {
      // Build filter based on user type
      const where: any = {
        isRead: false,
      };

      // Admin users see all notifications without recipient OR with their adminUser ID
      if (user.userType === 'admin') {
        where.$or = [
          { recipient: null }, // Global notifications
          { adminUser: user.id },
        ];
      } else {
        // Reseller users see only their own notifications
        where.recipient = user.id;
      }

      const [unreadCount, notifications] = await Promise.all([
        strapi.db.query('api::notification.notification').count({ where }),
        strapi.entityService.findMany('api::notification.notification' as any, {
          filters: where,
          populate: ['relatedOrder', 'relatedProduct', 'recipient', 'adminUser'],
          sort: { createdAt: 'desc' },
          fields: ['id', 'type', 'title', 'message', 'isRead', 'link', 'createdAt', 'updatedAt'],
        }),
      ]);

      // Ensure all notifications have valid timestamps
      const notificationArray = Array.isArray(notifications) ? notifications : [notifications];
      const notificationsWithTimestamps = notificationArray.map((notification: any) => ({
        ...notification,
        createdAt: notification.createdAt || new Date().toISOString(),
        updatedAt: notification.updatedAt || new Date().toISOString(),
      }));

      return {
        data: {
          unreadCount,
          notifications: notificationsWithTimestamps,
        },
      };
    } catch (error) {
      strapi.log.error('Get unread notifications error', {
        error: error.message,
        stack: error.stack,
        userId: user.id,
        correlationId: ctx.state.correlationId,
      });
      return ctx.internalServerError('Failed to retrieve unread notifications');
    }
  },

  /**
   * Mark all notifications as read for current user
   */
  async markAllAsRead(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    try {
      // Build filter based on user type
      const filters: any = {
        isRead: false,
      };

      if (user.userType === 'admin') {
        filters.$or = [
          { recipient: null },
          { adminUser: user.id },
        ];
      } else {
        filters.recipient = user.id;
      }

      // Find all unread notifications for this user
      const notifications = await strapi.entityService.findMany(
        'api::notification.notification' as any,
        {
          filters,
          fields: ['id'],
        }
      );

      // Update each notification individually
      const notificationArray = Array.isArray(notifications) ? notifications : [notifications];

      await Promise.all(
        notificationArray.map((notification: any) =>
          strapi.entityService.update(
            'api::notification.notification' as any,
            notification.id,
            {
              data: { isRead: true } as any,
            }
          )
        )
      );

      return {
        data: {
          message: 'All notifications marked as read',
        },
      };
    } catch (error) {
      strapi.log.error('Mark all notifications as read error', {
        error: error.message,
        stack: error.stack,
        userId: user.id,
        correlationId: ctx.state.correlationId,
      });
      return ctx.internalServerError('Failed to mark notifications as read');
    }
  },

  /**
   * Override find to filter by current user
   */
  async find(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    try {
      // Build filter based on user type
      const filters: any = ctx.query.filters || {};

      if (user.userType === 'admin') {
        filters.$or = [
          { recipient: null },
          { adminUser: user.id },
        ];
      } else {
        filters.recipient = user.id;
      }

      // Get pagination params from query or use defaults
      const page = ctx.query.pagination?.page || 1;
      const pageSize = ctx.query.pagination?.pageSize || 25;
      const start = (page - 1) * pageSize;

      // Get total count for pagination
      const totalCount = await strapi.db.query('api::notification.notification').count({
        where: filters,
      });

      // Get notifications with pagination
      const notifications = await strapi.entityService.findMany('api::notification.notification' as any, {
        ...ctx.query,
        filters,
        start,
        limit: pageSize,
        sort: ctx.query.sort || { createdAt: 'desc' },
        populate: ['relatedOrder', 'relatedProduct', 'recipient'],
        fields: ['id', 'type', 'title', 'message', 'isRead', 'link', 'createdAt', 'updatedAt'],
      });

      // Ensure all notifications have valid timestamps
      const notificationArray = Array.isArray(notifications) ? notifications : [notifications];
      const notificationsWithTimestamps = notificationArray.map((notification: any) => ({
        ...notification,
        createdAt: notification.createdAt || new Date().toISOString(),
        updatedAt: notification.updatedAt || new Date().toISOString(),
      }));

      // Return in proper format with pagination metadata
      return {
        data: notificationsWithTimestamps,
        meta: {
          pagination: {
            page,
            pageSize,
            pageCount: Math.ceil(totalCount / pageSize),
            total: totalCount,
          },
        },
      };
    } catch (error) {
      strapi.log.error('Find notifications error', {
        error: error.message,
        stack: error.stack,
        userId: user.id,
        correlationId: ctx.state.correlationId,
      });
      return ctx.internalServerError('Failed to retrieve notifications');
    }
  },

  /**
   * Override update to check ownership
   */
  async update(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    try {
      const notification: any = await strapi.entityService.findOne('api::notification.notification' as any, id, {
        populate: ['recipient', 'adminUser'],
      });

      if (!notification) {
        return ctx.notFound('Notification not found');
      }

      // Check ownership
      const recipientId = typeof notification.recipient === 'object' ? notification.recipient?.id : notification.recipient;
      const adminUserId = typeof notification.adminUser === 'object' ? notification.adminUser?.id : notification.adminUser;

      const isOwner = recipientId === user.id ||
                      adminUserId === user.id ||
                      (user.userType === 'admin' && !recipientId && !adminUserId);

      if (!isOwner) {
        return ctx.forbidden('Cannot update this notification');
      }

      // Allow only isRead field to be updated
      const updated = await strapi.entityService.update('api::notification.notification' as any, id, {
        data: { isRead: ctx.request.body.data?.isRead } as any,
      });

      return updated;
    } catch (error) {
      strapi.log.error('Update notification error', {
        error: error.message,
        stack: error.stack,
        notificationId: id,
        userId: user.id,
        correlationId: ctx.state.correlationId,
      });
      return ctx.internalServerError('Failed to update notification');
    }
  },
}));

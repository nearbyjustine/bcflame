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
      console.error('Get unread count error:', error);
      ctx.throw(500, error);
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
      const where: any = {
        isRead: false,
      };

      if (user.userType === 'admin') {
        where.$or = [
          { recipient: null },
          { adminUser: user.id },
        ];
      } else {
        where.recipient = user.id;
      }

      // Update all unread notifications for this user
      await strapi.db.query('api::notification.notification').updateMany({
        where,
        data: { isRead: true },
      });

      return {
        data: {
          message: 'All notifications marked as read',
        },
      };
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      ctx.throw(500, error);
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

      const notifications = await strapi.entityService.findMany('api::notification.notification' as any, {
        ...ctx.query,
        filters,
        populate: ['relatedOrder', 'relatedProduct', 'recipient'],
      });

      return notifications;
    } catch (error) {
      console.error('Find notifications error:', error);
      ctx.throw(500, error);
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
      console.error('Update notification error:', error);
      ctx.throw(500, error);
    }
  },
}));

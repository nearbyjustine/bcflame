/**
 * notification controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::notification.notification' as any, ({ strapi }) => ({
  /**
   * Get unread notifications for the current admin user
   */
  async getUnread(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    // Check if user is admin
    if (user.userType !== 'admin') {
      return ctx.forbidden('Admin access required');
    }

    try {
      // Get unread count
      const unreadCount = await strapi.db.query('api::notification.notification').count({
        where: {
          isRead: false,
          $or: [
            { adminUser: user.id },
            { adminUser: null }, // Global notifications for all admins
          ],
        },
      });

      // Get recent unread notifications (limit 10)
      const notifications = await strapi.entityService.findMany('api::notification.notification' as any, {
        filters: {
          isRead: false,
          $or: [
            { adminUser: user.id },
            { adminUser: null },
          ],
        },
        sort: { createdAt: 'desc' },
        limit: 10,
        populate: ['relatedOrder', 'relatedProduct'],
      });

      return {
        data: {
          unreadCount,
          notifications,
        },
      };
    } catch (error) {
      console.error('Get unread notifications error:', error);
      ctx.throw(500, error);
    }
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    try {
      const notification: any = await strapi.entityService.findOne('api::notification.notification' as any, id);

      if (!notification) {
        return ctx.notFound('Notification not found');
      }

      // Check ownership (if notification is for specific admin)
      if (notification.adminUser && notification.adminUser !== user.id && user.userType !== 'admin') {
        return ctx.forbidden('Cannot mark this notification as read');
      }

      await strapi.entityService.update('api::notification.notification' as any, id, {
        data: { isRead: true } as any,
      });

      return {
        data: {
          message: 'Notification marked as read',
          id,
        },
      };
    } catch (error) {
      console.error('Mark notification as read error:', error);
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
      // Update all unread notifications for this user
      await strapi.db.query('api::notification.notification').updateMany({
        where: {
          isRead: false,
          $or: [
            { adminUser: user.id },
            { adminUser: null },
          ],
        },
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
}));

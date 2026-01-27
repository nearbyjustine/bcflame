/**
 * Notification service
 * Centralizes notification creation and Socket.IO emission
 */

import type { Strapi } from '@strapi/strapi';

interface NotificationData {
  type: 'new_order' | 'low_stock' | 'payment_received' | 'order_status_changed' | 'payment_reminder' | 'new_product' | 'new_message' | 'system';
  title: string;
  message?: string;
  recipient?: number | null;
  adminUser?: number | null;
  link?: string;
  relatedOrder?: number;
  relatedProduct?: number;
  metadata?: Record<string, any>;
}

/**
 * Create a notification and emit Socket.IO event
 */
export async function createNotification(
  strapi: Strapi,
  data: NotificationData
): Promise<any> {
  try {
    // Create notification in database
    const notification = await strapi.entityService.create(
      'api::notification.notification',
      {
        data: {
          ...data,
          isRead: false,
        } as any,
      }
    );

    // Emit Socket.IO event for real-time notification
    const io = strapi.io;
    if (io && notification) {
      // Fetch complete notification with relations
      const fullNotification = await strapi.entityService.findOne(
        'api::notification.notification',
        notification.id,
        {
          populate: ['relatedOrder', 'relatedProduct', 'recipient', 'adminUser'],
        }
      );

      // Determine who should receive the notification
      let recipientIds: number[] = [];

      if (data.recipient) {
        recipientIds.push(data.recipient);
      }

      if (data.adminUser) {
        recipientIds.push(data.adminUser);
      }

      // If no specific recipient, broadcast to all admins
      if (recipientIds.length === 0) {
        // Get all admin users
        const admins = await strapi.db
          .query('plugin::users-permissions.user')
          .findMany({
            where: { userType: 'admin' },
            select: ['id'],
          });

        recipientIds = admins.map((admin: any) => admin.id);
      }

      // Emit to all recipient rooms
      recipientIds.forEach((recipientId) => {
        io.to(`user:${recipientId}`).emit('notification:new', {
          notification: fullNotification,
        });
      });

      strapi.log.info(
        `📢 Emitted notification:new event to ${recipientIds.length} user(s)`
      );
    }

    return notification;
  } catch (error) {
    strapi.log.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Emit Socket.IO event for existing notification
 * Useful when updating notifications
 */
export async function emitNotification(
  strapi: Strapi,
  notificationId: number
): Promise<void> {
  try {
    const io = strapi.io;
    if (!io) {
      return;
    }

    // Fetch notification with relations
    const notification = await strapi.entityService.findOne(
      'api::notification.notification',
      notificationId,
      {
        populate: ['relatedOrder', 'relatedProduct', 'recipient', 'adminUser'],
      }
    );

    if (!notification) {
      return;
    }

    // Determine recipients
    const recipientIds: number[] = [];
    const recipient = notification.recipient as any;
    const adminUser = notification.adminUser as any;

    if (recipient?.id) {
      recipientIds.push(recipient.id);
    }

    if (adminUser?.id) {
      recipientIds.push(adminUser.id);
    }

    // Emit to recipient rooms
    recipientIds.forEach((recipientId) => {
      io.to(`user:${recipientId}`).emit('notification:update', {
        notification,
      });
    });

    strapi.log.info(
      `📢 Emitted notification:update event to ${recipientIds.length} user(s)`
    );
  } catch (error) {
    strapi.log.error('Error emitting notification:', error);
  }
}

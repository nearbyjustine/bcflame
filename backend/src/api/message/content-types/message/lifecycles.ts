/**
 * Message lifecycle hooks
 */

import { createNotification } from '../../../../services/notification';

export default {
  /**
   * After create - notify recipient of new message
   */
  async afterCreate(event) {
    const { result } = event;

    try {
      // Fetch message with conversation, sender, and relatedOrder
      const message = await strapi.db.query('api::message.message').findOne({
        where: { id: result.id },
        populate: {
          conversation: {
            populate: ['participant_admin', 'participant_partner'],
          },
          sender: true,
          relatedOrder: true,
        },
      });

      if (!message?.conversation) {
        strapi.log.warn('Message notification: No conversation found for message');
        return;
      }

      // Find recipient (participant who is not the sender)
      const senderId = typeof message.sender === 'object' ? message.sender.id : message.sender;

      const participantAdmin = message.conversation.participant_admin;
      const participantPartner = message.conversation.participant_partner;

      const adminId = typeof participantAdmin === 'object' ? participantAdmin.id : participantAdmin;
      const partnerId = typeof participantPartner === 'object' ? participantPartner.id : participantPartner;

      // Determine recipient (the one who is NOT the sender)
      let recipientId = null;
      if (senderId === adminId) {
        recipientId = partnerId; // Admin sent, notify partner
      } else if (senderId === partnerId) {
        recipientId = adminId; // Partner sent, notify admin
      }

      if (!recipientId) {
        strapi.log.warn('Message notification: Could not determine recipient');
        return;
      }

      const senderName = message.sender?.username || message.sender?.email || 'Someone';

      // Determine link based on recipient type
      const recipient = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: recipientId },
      });

      const link = recipient?.userType === 'admin'
        ? `/admin-portal/messages/${message.conversation.id}`
        : `/messages/${message.conversation.id}`;

      // Build notification data with message metadata
      const notificationData: any = {
        type: 'new_message',
        title: `New message from ${senderName}`,
        message: message.content.substring(0, 200), // Include message preview
        recipient: recipientId,
        link: link,
        metadata: {
          messageType: message.messageType,
          messageId: message.id,
          conversationId: message.conversation.id,
        },
      };

      // Include relatedOrder if it's an order_update message
      if (message.messageType === 'order_update' && message.relatedOrder) {
        notificationData.relatedOrder = message.relatedOrder.id || message.relatedOrder;
        notificationData.title = `Order update from ${senderName}`;
      }

      // Create notification and emit Socket.IO event
      await createNotification(strapi, notificationData);

      strapi.log.info(`✉️ Created new message notification for user ${recipientId} from ${senderName}`);
    } catch (error) {
      // Non-blocking: don't fail message creation if notification fails
      strapi.log.error('Error creating message notification:', error);
    }
  },
};

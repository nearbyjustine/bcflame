/**
 * Message lifecycle hooks
 */

export default {
  /**
   * After create - notify recipient of new message
   */
  async afterCreate(event) {
    const { result } = event;

    try {
      // Fetch message with conversation and sender
      const message = await strapi.db.query('api::message.message').findOne({
        where: { id: result.id },
        populate: {
          conversation: {
            populate: ['participant_admin', 'participant_partner'],
          },
          sender: true,
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

      // Create notification for recipient
      await strapi.entityService.create('api::notification.notification', {
        data: {
          type: 'new_message',
          title: `New message from ${senderName}`,
          message: `You have a new message`,
          isRead: false,
          recipient: recipientId,
          link: link,
        },
      });

      strapi.log.info(`✉️ Created new message notification for user ${recipientId} from ${senderName}`);
    } catch (error) {
      // Non-blocking: don't fail message creation if notification fails
      strapi.log.error('Error creating message notification:', error);
    }
  },
};

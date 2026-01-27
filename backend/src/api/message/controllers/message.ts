import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::message.message',
  ({ strapi }) => ({
    // Find messages for a conversation (with pagination)
    async find(ctx) {
      const { conversationId, page = 1, pageSize = 50 } = ctx.query;
      const user = ctx.state.user;

      if (!conversationId) {
        return ctx.badRequest('conversationId query parameter required');
      }

      // Validate pagination parameters
      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string) || 50));

      if (isNaN(pageNum) || isNaN(pageSizeNum)) {
        return ctx.badRequest('Invalid pagination parameters');
      }

      // Verify user has access to conversation
      const conversation = await strapi.db.query('api::conversation.conversation').findOne({
        where: { id: conversationId },
      });

      if (!conversation) {
        return ctx.notFound('Conversation not found');
      }

      if (
        conversation.participant_admin !== user.id &&
        conversation.participant_partner !== user.id &&
        user.userType !== 'admin'
      ) {
        return ctx.forbidden('Access denied');
      }

      // Fetch messages with pagination
      const messages = await strapi.db.query('api::message.message').findMany({
        where: { conversation: conversationId },
        populate: {
          sender: {
            select: ['id', 'username', 'userType'],
          },
          relatedOrder: {
            select: ['id', 'inquiry_number'],
          },
        },
        orderBy: { createdAt: 'desc' },
        limit: pageSizeNum,
        offset: (pageNum - 1) * pageSizeNum,
      });

      // Reverse to show oldest first
      messages.reverse();

      return { data: messages };
    },

    // Create new message (called via REST, but Socket.IO emits to clients)
    async create(ctx) {
      const user = ctx.state.user;
      const { conversationId, content, messageType = 'text', relatedOrderId } = ctx.request.body;

      if (!conversationId || !content) {
        return ctx.badRequest('conversationId and content are required');
      }

      // Verify conversation access
      const conversation = await strapi.db.query('api::conversation.conversation').findOne({
        where: { id: conversationId },
        populate: {
          participant_admin: { select: ['id'] },
          participant_partner: { select: ['id'] },
        },
      });

      if (!conversation) {
        return ctx.notFound('Conversation not found');
      }

      if (
        conversation.participant_admin.id !== user.id &&
        conversation.participant_partner.id !== user.id &&
        user.userType !== 'admin'
      ) {
        return ctx.forbidden('Access denied');
      }

      // Create message
      const message = await strapi.db.query('api::message.message').create({
        data: {
          conversation: conversationId,
          sender: user.id,
          content,
          messageType,
          relatedOrder: relatedOrderId || null,
          isRead: false,
        },
        populate: {
          sender: {
            select: ['id', 'username', 'userType'],
          },
        },
      });

      // Update conversation metadata
      const updateData: any = {
        lastMessageAt: new Date(),
        lastMessagePreview: content.substring(0, 200),
      };

      // Increment unread count for recipient
      if (conversation.participant_admin.id === user.id) {
        updateData.unreadCount_partner = (conversation.unreadCount_partner || 0) + 1;
      } else {
        updateData.unreadCount_admin = (conversation.unreadCount_admin || 0) + 1;
      }

      await strapi.db.query('api::conversation.conversation').update({
        where: { id: conversationId },
        data: updateData,
      });

      // Emit message via Socket.IO
      const io = strapi.io;
      if (io) {
        io.to(`conversation:${conversationId}`).emit('message:new', {
          message,
          conversationId,
        });

        // Emit unread count update to recipient
        const recipientId =
          conversation.participant_admin.id === user.id
            ? conversation.participant_partner.id
            : conversation.participant_admin.id;

        io.to(`user:${recipientId}`).emit('conversation:unread', {
          conversationId,
          unreadCount: updateData.unreadCount_admin || updateData.unreadCount_partner,
        });
      }

      return { data: message };
    },
  })
);

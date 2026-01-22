import type { Server as SocketIOServer, Socket } from 'socket.io';
import type { Strapi } from '@strapi/strapi';

export const registerMessageHandlers = (_io: SocketIOServer, socket: Socket) => {
  // Join conversation room
  socket.on('conversation:join', async (conversationId: number) => {
    const userId = socket.data.userId;
    const strapiInstance = global.strapi as Strapi;

    // Verify user has access to conversation
    const conversation = await strapiInstance.db.query('api::conversation.conversation').findOne({
      where: { id: conversationId },
      populate: ['participant_admin', 'participant_partner'],
    });

    if (!conversation) {
      socket.emit('error', { message: 'Conversation not found' });
      return;
    }

    const adminId = conversation.participant_admin?.id || conversation.participant_admin;
    const partnerId = conversation.participant_partner?.id || conversation.participant_partner;

    const isParticipant = adminId === userId || partnerId === userId;
    const isAdmin = socket.data.userType === 'admin';

    if (!isParticipant && !isAdmin) {
      socket.emit('error', { message: 'Access denied' });
      return;
    }

    // Join room
    socket.join(`conversation:${conversationId}`);
    console.log(`User ${userId} joined conversation ${conversationId}`);
  });

  // Leave conversation room
  socket.on('conversation:leave', (conversationId: number) => {
    socket.leave(`conversation:${conversationId}`);
    console.log(`User ${socket.data.userId} left conversation ${conversationId}`);
  });

  // Typing indicator
  socket.on('message:typing', (data: { conversationId: number; isTyping: boolean }) => {
    socket.to(`conversation:${data.conversationId}`).emit('message:typing', {
      userId: socket.data.userId,
      username: socket.data.username,
      isTyping: data.isTyping,
    });
  });
};

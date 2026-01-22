import type { Server as SocketIOServer, Socket } from 'socket.io';
import type { Strapi } from '@strapi/strapi';

export const registerConversationHandlers = (_io: SocketIOServer, socket: Socket) => {
  const userId = socket.data.userId;

  // Join user-specific room for notifications
  socket.join(`user:${userId}`);
  console.log(`User ${userId} joined personal notification room`);

  // Request unread count on connect
  socket.on('conversation:requestUnreadCount', async () => {
    const conversations = await (global.strapi as Strapi).db.query('api::conversation.conversation').findMany({
      where: {
        $or: [{ participant_admin: userId }, { participant_partner: userId }],
        status: 'active',
      },
      select: ['id', 'participant_admin', 'unreadCount_admin', 'unreadCount_partner'],
    });

    let totalUnread = 0;
    conversations.forEach((conv) => {
      if (conv.participant_admin === userId) {
        totalUnread += conv.unreadCount_admin || 0;
      } else {
        totalUnread += conv.unreadCount_partner || 0;
      }
    });

    socket.emit('conversation:unreadCount', { totalUnread });
  });
};

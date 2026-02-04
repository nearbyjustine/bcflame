import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import socketConfig from '../../config/socket';
import { authenticateSocket } from './middleware/auth';
import { registerMessageHandlers } from './handlers/message';
import { registerConversationHandlers } from './handlers/conversation';

let io: SocketIOServer | null = null;

export const initializeSocket = (httpServer: HTTPServer) => {
  io = new SocketIOServer(httpServer, {
    cors: socketConfig.cors,
    transports: socketConfig.transports,
    pingTimeout: socketConfig.pingTimeout,
    pingInterval: socketConfig.pingInterval,
  });

  // Authentication middleware
  io.use(authenticateSocket);

  // Connection handler
  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    strapi.log.info(`User connected: ${userId}`, { userId, socketId: socket.id });

    // Join user-specific room for targeted notifications
    const userRoom = `user:${userId}`;
    socket.join(userRoom);
    strapi.log.info(`User ${userId} joined personal room: ${userRoom}`, { userId, userRoom, socketId: socket.id });

    // Register event handlers
    registerMessageHandlers(io, socket);
    registerConversationHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      strapi.log.info(`User disconnected: ${userId}, reason: ${reason}`, { userId, reason, socketId: socket.id });
    });
  });

  return io;
};

export const getIO = (): SocketIOServer | null => {
  return io;
};

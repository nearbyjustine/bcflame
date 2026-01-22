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
    console.log(`User connected: ${socket.data.userId}`);

    // Register event handlers
    registerMessageHandlers(io, socket);
    registerConversationHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.data.userId}, reason: ${reason}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer | null => {
  return io;
};

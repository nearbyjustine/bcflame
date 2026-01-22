export default {
  enabled: true,
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket', 'polling'] as ('websocket' | 'polling')[],
  pingTimeout: 60000,
  pingInterval: 25000,
};

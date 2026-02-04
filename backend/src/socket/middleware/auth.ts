import type { Socket } from 'socket.io';
import type { Strapi } from '@strapi/strapi';

export const authenticateSocket = async (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication token missing'));
    }

    const strapiInstance = global.strapi as Strapi;

    // Verify JWT token using Strapi's JWT service
    const decoded = await strapiInstance.plugins['users-permissions'].services.jwt.verify(token);

    // Fetch user from database
    const user = await strapiInstance.query('plugin::users-permissions.user').findOne({
      where: { id: decoded.id },
      populate: ['role'],
    });

    if (!user) {
      return next(new Error('User not found'));
    }

    // Attach user data to socket
    socket.data.userId = user.id;
    socket.data.userType = user.userType;
    socket.data.username = user.username;

    next();
  } catch (error) {
    const strapiInstance = global.strapi as Strapi;
    strapiInstance.log.error('Socket authentication error', {
      error: error.message,
      stack: error.stack,
    });
    next(new Error('Authentication failed'));
  }
};

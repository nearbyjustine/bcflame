/**
 * Custom routes for notification
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/notifications/unread',
      handler: 'notification.getUnreadCount',
      config: {
        policies: [],
        middlewares: ['global::require-auth'],
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/notifications/mark-all-read',
      handler: 'notification.markAllAsRead',
      config: {
        policies: [],
        middlewares: ['global::require-auth'],
        auth: false,
      },
    },
  ],
};

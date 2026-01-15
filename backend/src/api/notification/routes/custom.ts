/**
 * Custom routes for notification
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/notifications/unread',
      handler: 'notification.getUnread',
      config: {
        policies: [],
      },
    },
    {
      method: 'PUT',
      path: '/notifications/:id/read',
      handler: 'notification.markAsRead',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/notifications/read-all',
      handler: 'notification.markAllAsRead',
      config: {
        policies: [],
      },
    },
  ],
};

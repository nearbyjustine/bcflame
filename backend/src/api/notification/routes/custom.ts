/**
 * Custom routes for notification
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/notifications/unread/count',
      handler: 'notification.getUnreadCount',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/notifications/mark-all-read',
      handler: 'notification.markAllAsRead',
      config: {
        policies: [],
      },
    },
  ],
};

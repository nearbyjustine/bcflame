export default {
  routes: [
    {
      method: 'GET',
      path: '/conversations',
      handler: 'conversation.find',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/conversations/:id',
      handler: 'conversation.findOne',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/conversations/with-user/:userId',
      handler: 'conversation.findOrCreate',
      config: {
        policies: [],
      },
    },
    {
      method: 'PUT',
      path: '/conversations/:id/mark-read',
      handler: 'conversation.markAsRead',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/conversations/unread-count',
      handler: 'conversation.getUnreadCount',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/conversations/:id/partner-orders',
      handler: 'conversation.getPartnerOrders',
      config: {
        policies: [],
      },
    },
  ],
};

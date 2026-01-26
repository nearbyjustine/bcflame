/**
 * Custom routes for order-inquiry
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/order-inquiries/batch',
      handler: 'order-inquiry.batch',
      config: {
        policies: [],
        middlewares: ['api::order-inquiry.require-auth'],
      },
    },
    {
      method: 'GET',
      path: '/order-inquiries/statistics',
      handler: 'order-inquiry.statistics',
      config: {
        policies: [],
        middlewares: ['api::order-inquiry.require-auth'],
      },
    },
    {
      method: 'POST',
      path: '/order-inquiries/bulk-update-status',
      handler: 'order-inquiry.bulkUpdateStatus',
      config: {
        policies: [],
        middlewares: ['api::order-inquiry.require-auth'],
      },
    },
    {
      method: 'GET',
      path: '/order-inquiries/export',
      handler: 'order-inquiry.export',
      config: {
        policies: [],
        middlewares: ['api::order-inquiry.require-auth'],
      },
    },
  ],
};

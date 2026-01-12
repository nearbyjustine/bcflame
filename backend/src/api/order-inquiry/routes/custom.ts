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
        middlewares: [],
      },
    },
  ],
};

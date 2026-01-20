/**
 * Custom routes for product
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/products/statistics',
      handler: 'product.statistics',
      config: {
        policies: [],
      },
    },
  ],
};

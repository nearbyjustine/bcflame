/**
 * Custom product routes
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/products/statistics',
      handler: 'product.statistics',
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/products/photos',
      handler: 'product.photos',
      config: {
        policies: [],
      },
    },
  ],
};

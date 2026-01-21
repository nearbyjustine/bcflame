/**
 * Dashboard routes
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/dashboard/admin',
      handler: 'dashboard.getAdminStats',
      config: {
        policies: [],
        middlewares: ['global::require-auth'],
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/dashboard/reseller',
      handler: 'dashboard.getResellerStats',
      config: {
        policies: [],
        middlewares: ['global::require-auth'],
        auth: false,
      },
    },
  ],
};

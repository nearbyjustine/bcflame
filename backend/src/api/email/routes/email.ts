/**
 * Email routes
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/email/health',
      handler: 'email.health',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/email/test',
      handler: 'email.test',
      config: {
        policies: ['admin::isAuthenticatedAdmin'], // Only admins can send test emails
        middlewares: [],
      },
    },
  ],
};

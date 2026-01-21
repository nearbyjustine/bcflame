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
        policies: [],
        middlewares: ['global::require-auth'], // Only authenticated users can send test emails
        auth: false,
      },
    },
  ],
};

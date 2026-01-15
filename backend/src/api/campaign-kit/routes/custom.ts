/**
 * Custom routes for campaign-kit
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/campaign-kits/:id/download',
      handler: 'campaign-kit.download',
      config: {
        policies: [],
      },
    },
  ],
};

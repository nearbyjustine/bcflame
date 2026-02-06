/**
 * Custom routes for media-asset
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/media-assets/statistics',
      handler: 'media-asset.statistics',
      config: {
        policies: [],
        middlewares: ['global::require-auth'],
      },
    },
    {
      method: 'POST',
      path: '/media-assets/:id/download',
      handler: 'media-asset.download',
      config: {
        policies: [],
        middlewares: ['global::require-auth'],
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/media-assets/access-status',
      handler: 'media-asset.accessStatus',
      config: {
        policies: [],
        middlewares: ['global::require-auth'],
        auth: false,
      },
    },
  ],
};

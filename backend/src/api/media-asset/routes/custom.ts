/**
 * Custom routes for media-asset
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/media-assets/:id/download',
      handler: 'media-asset.download',
      config: {
        policies: [],
      },
    },
  ],
};

/**
 * media-asset router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::media-asset.media-asset' as any, {
  config: {
    find: {},
    findOne: {},
    create: {},
    update: {},
    delete: {},
  },
});

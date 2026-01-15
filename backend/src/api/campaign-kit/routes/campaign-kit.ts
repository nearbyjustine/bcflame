/**
 * campaign-kit router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::campaign-kit.campaign-kit' as any, {
  config: {
    find: {},
    findOne: {},
    create: {},
    update: {},
    delete: {},
  },
});

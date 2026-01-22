/**
 * conversation router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::conversation.conversation', {
  config: {
    find: {
      middlewares: [],
    },
    findOne: {
      middlewares: [],
    },
    create: {
      middlewares: [],
    },
    update: {
      middlewares: [],
    },
    delete: {
      middlewares: [],
    },
  },
});

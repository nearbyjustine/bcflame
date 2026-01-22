/**
 * message router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::message.message', {
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

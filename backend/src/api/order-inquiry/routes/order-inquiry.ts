/**
 * order-inquiry router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::order-inquiry.order-inquiry', {
  config: {
    create: {
      middlewares: ['api::order-inquiry.require-auth'],
    },
    update: {
      middlewares: ['api::order-inquiry.require-auth'],
    },
  },
});

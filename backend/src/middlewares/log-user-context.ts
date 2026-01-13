/**
 * Middleware to log user authentication context for debugging
 */
export default (config, { strapi }) => {
  return async (ctx, next) => {
    // Check if this is an order-inquiry POST request
    if (ctx.url?.includes('/order-inquiries') && ctx.method === 'POST') {
      strapi.log.info('🌍 GLOBAL MIDDLEWARE - Order Inquiry POST Request');
      strapi.log.info('URL:', ctx.url);
      strapi.log.info('Method:', ctx.method);
      strapi.log.info('Authorization header present?', !!ctx.headers?.authorization);
      strapi.log.info('Authorization header value:', ctx.headers?.authorization);
      strapi.log.info('User authenticated?', !!ctx.state?.user);
      strapi.log.info('User ID:', ctx.state?.user?.id);
    }

    await next();

    if (ctx.url?.includes('/order-inquiries') && ctx.method === 'POST') {
      strapi.log.info('🌍 After next() - User ID:', ctx.state?.user?.id);
    }
  };
};

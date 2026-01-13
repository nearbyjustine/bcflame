/**
 * Middleware to require authentication for order inquiry routes
 * This ensures ctx.state.user is populated before the controller executes
 */
export default (config, { strapi }) => {
  return async (ctx, next) => {
    strapi.log.debug('🔥 REQUIRE-AUTH MIDDLEWARE - START');
    
    try {
      // Use ctx.request.header (singular) - Koa's preferred accessor
      // Also try ctx.headers as fallback
      const authHeader = ctx.request.header.authorization || ctx.headers?.authorization;
      
      strapi.log.debug(`🔥 Authorization header present: ${!!authHeader}`);
      
      if (!authHeader) {
        strapi.log.warn('🔥 No Authorization header found in request');
        return ctx.unauthorized('No authorization token was found');
      }

      const token = authHeader.replace('Bearer ', '');
      strapi.log.debug(`🔥 Token extracted (first 30 chars): ${token.substring(0, 30)}...`);

      // If user is not already populated by Strapi's built-in auth, verify manually
      if (!ctx.state.user) {
        strapi.log.debug('🔥 ctx.state.user not set, verifying JWT manually...');
        
        const jwtService = strapi.plugin('users-permissions').service('jwt');
        const decoded = await jwtService.verify(token);
        
        strapi.log.debug(`🔥 JWT decoded successfully, user ID: ${decoded.id}`);

        // Fetch the user from database
        const user = await strapi.query('plugin::users-permissions.user').findOne({
          where: { id: decoded.id },
        });

        if (!user) {
          strapi.log.warn(`🔥 User ${decoded.id} not found in database`);
          return ctx.unauthorized('Invalid token: user not found');
        }

        // Populate ctx.state.user for downstream middleware/controllers
        ctx.state.user = user;
        strapi.log.info(`🔥 JWT verified - User populated: ID=${user.id}, email=${user.email}`);
      } else {
        strapi.log.debug(`🔥 ctx.state.user already set: ID=${ctx.state.user.id}`);
      }

      await next();
    } catch (error) {
      strapi.log.error('🔥 Authentication middleware error:', error.message);
      return ctx.unauthorized('Invalid token');
    }
  };
};

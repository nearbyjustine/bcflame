/**
 * Global middleware to require authentication for custom routes
 * This ensures ctx.state.user is populated before controllers execute
 */
export default (config, { strapi }) => {
  return async (ctx, next) => {
    const authHeader = ctx.request.header.authorization || ctx.headers?.authorization;

    if (!authHeader) {
      return ctx.unauthorized('No authorization token was found');
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      // If user is not already populated by Strapi's built-in auth, verify manually
      if (!ctx.state.user) {
        const jwtService = strapi.plugin('users-permissions').service('jwt');
        const decoded = await jwtService.verify(token);

        // Fetch the user from database
        const user = await strapi.query('plugin::users-permissions.user').findOne({
          where: { id: decoded.id },
        });

        if (!user) {
          return ctx.unauthorized('Invalid token: user not found');
        }

        // Populate ctx.state.user for downstream controllers
        ctx.state.user = user;
      }
    } catch (error) {
      return ctx.unauthorized('Invalid token');
    }

    // Call next middleware/controller
    await next();
  };
};

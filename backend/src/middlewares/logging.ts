import type { Context, Next } from 'koa';

/**
 * Request/Response logging middleware
 * Logs all incoming requests and outgoing responses with correlation IDs
 *
 * This middleware provides structured logging for all HTTP requests and responses,
 * including timing information, status codes, and user context. It uses different
 * log levels based on response status (info for 2xx/3xx, warn for 4xx, error for 5xx).
 *
 * @param config - Middleware configuration
 * @param config.skipPaths - Array of path prefixes to skip logging (e.g., ['/_health', '/admin'])
 * @param strapi - Strapi instance
 * @returns Koa middleware function
 */
export default (config: any, { strapi }: { strapi: any }) => {
  const skipPaths = config?.skipPaths || [];

  return async (ctx: Context, next: Next) => {
    const startTime = Date.now();
    const { method, path, ip } = ctx.request;
    const correlationId = ctx.state.correlationId || 'N/A';
    const userId = ctx.state.user?.id || 'anonymous';

    // Skip health checks and admin panel if configured
    if (skipPaths.some((skip: string) => path.startsWith(skip))) {
      return next();
    }

    // Log incoming request
    strapi.log.info(`[${correlationId}] → ${method} ${path}`, {
      userId,
      ip,
      userAgent: ctx.request.headers['user-agent'],
    });

    try {
      await next();
    } catch (error) {
      // Error will be logged by Strapi's error middleware
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      const { status } = ctx.response;

      // Log response with appropriate level based on status code
      const logLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
      strapi.log[logLevel](`[${correlationId}] ← ${method} ${path} ${status} (${duration}ms)`, {
        status,
        duration,
        userId,
      });
    }
  };
};

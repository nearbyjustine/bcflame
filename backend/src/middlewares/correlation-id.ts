import type { Context, Next } from 'koa';
import { randomUUID } from 'crypto';

/**
 * Correlation ID middleware
 * Adds X-Correlation-ID header to all requests/responses for request tracing
 *
 * This middleware generates a unique correlation ID for each request or uses
 * an existing one from the X-Correlation-ID header. This enables request tracing
 * across services and makes debugging easier.
 *
 * @param config - Middleware configuration (unused)
 * @param strapi - Strapi instance
 * @returns Koa middleware function
 */
export default (config: any, { strapi }: { strapi: any }) => {
  return async (ctx: Context, next: Next) => {
    // Get correlation ID from request header or generate new one
    const correlationId = ctx.request.headers['x-correlation-id'] as string || randomUUID();

    // Store in context for use in controllers and other middlewares
    ctx.state.correlationId = correlationId;

    // Set response header so clients can track their requests
    ctx.set('X-Correlation-ID', correlationId);

    // Continue to next middleware
    await next();
  };
};

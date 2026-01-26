/**
 * Rate Limiting Middleware for Strapi
 *
 * Implements rate limiting to prevent abuse and DoS attacks.
 * Uses in-memory store for single-server deployments.
 * For multi-server deployments, consider using Redis store.
 */

import type { Context, Next } from 'koa';
import { defaultRateLimitConfig, determineRateLimitRule, getRateLimitConfig } from '../../config/rate-limits';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitStore {
  [key: string]: RateLimitEntry;
}

/**
 * In-memory store for rate limit tracking
 * Key format: "ruleName:identifier" (e.g., "login:192.168.1.1")
 */
const store: RateLimitStore = {};

/**
 * Cleanup interval to remove expired entries (runs every 5 minutes)
 */
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;

/**
 * Clean up expired entries from the store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  let cleanedCount = 0;

  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`[Rate Limit] Cleaned up ${cleanedCount} expired entries`);
  }
}

/**
 * Start the cleanup timer
 */
function startCleanupTimer(): void {
  if (cleanupTimer) {
    return;
  }

  cleanupTimer = setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL);

  // Don't keep the process running just for this timer
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}

/**
 * Stop the cleanup timer (useful for testing)
 */
export function stopCleanupTimer(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

/**
 * Clear all entries from the store (useful for testing)
 */
export function clearStore(): void {
  for (const key in store) {
    delete store[key];
  }
}

/**
 * Get the client identifier (IP address or user ID)
 */
function getClientIdentifier(ctx: Context): string {
  // If authenticated, use user ID for more accurate tracking
  if (ctx.state.user?.id) {
    return `user:${ctx.state.user.id}`;
  }

  // Otherwise, use IP address
  // Check for IP behind proxy (nginx sets X-Real-IP and X-Forwarded-For)
  const forwarded = ctx.request.headers['x-forwarded-for'];
  if (forwarded) {
    // Take the first IP in the chain
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
    return `ip:${ip}`;
  }

  const realIp = ctx.request.headers['x-real-ip'];
  if (realIp) {
    return `ip:${Array.isArray(realIp) ? realIp[0] : realIp}`;
  }

  // Fallback to connection remote address
  return `ip:${ctx.request.ip || 'unknown'}`;
}

/**
 * Check if the request is from an admin user
 */
function isAdmin(ctx: Context): boolean {
  return ctx.state.user?.role?.type === 'admin' || ctx.state.user?.isAdmin === true;
}

/**
 * Rate limiting middleware
 */
export default (config: any, { strapi }: { strapi: any }) => {
  // Start cleanup timer on first use
  startCleanupTimer();

  return async (ctx: Context, next: Next) => {
    // Skip rate limiting if disabled
    if (!defaultRateLimitConfig.enabled) {
      return next();
    }

    // Skip rate limiting for health check and internal calls
    const path = ctx.request.path;
    if (path === '/_health' || path === '/admin/init') {
      return next();
    }

    try {
      // Determine which rate limit rule to apply
      const isAuthenticated = !!ctx.state.user;
      const isAdminUser = isAdmin(ctx);
      const ruleName = determineRateLimitRule(path, isAuthenticated, isAdminUser);
      const ruleConfig = getRateLimitConfig(ruleName);

      // Get client identifier
      const clientId = getClientIdentifier(ctx);
      const storeKey = `${ruleName}:${clientId}`;

      // Get or create rate limit entry
      const now = Date.now();
      let entry = store[storeKey];

      if (!entry || entry.resetTime < now) {
        // Create new entry or reset expired entry
        entry = {
          count: 0,
          resetTime: now + ruleConfig.windowMs,
        };
        store[storeKey] = entry;
      }

      // Increment request count
      entry.count++;

      // Calculate remaining requests
      const remaining = Math.max(0, ruleConfig.max - entry.count);
      const resetTime = Math.ceil((entry.resetTime - now) / 1000); // seconds until reset

      // Set rate limit headers
      ctx.set('RateLimit-Limit', String(ruleConfig.max));
      ctx.set('RateLimit-Remaining', String(remaining));
      ctx.set('RateLimit-Reset', String(resetTime));

      // Also set legacy X-RateLimit headers for compatibility
      ctx.set('X-RateLimit-Limit', String(ruleConfig.max));
      ctx.set('X-RateLimit-Remaining', String(remaining));
      ctx.set('X-RateLimit-Reset', String(Math.ceil(entry.resetTime / 1000)));

      // Check if rate limit exceeded
      if (entry.count > ruleConfig.max) {
        // Set Retry-After header (seconds until reset)
        ctx.set('Retry-After', String(resetTime));

        // Log rate limit violation
        console.warn(
          `[Rate Limit] Blocked: ${clientId} exceeded ${ruleName} limit (${entry.count}/${ruleConfig.max}) on ${path}`
        );

        // Return 429 Too Many Requests
        ctx.status = 429;
        ctx.body = {
          error: {
            status: 429,
            name: 'TooManyRequests',
            message: ruleConfig.message || 'Too many requests. Please try again later.',
            details: {
              limit: ruleConfig.max,
              remaining: 0,
              resetTime,
              retryAfter: resetTime,
            },
          },
        };

        return; // Don't call next()
      }

      // Rate limit not exceeded, continue to next middleware
      await next();

      // Handle skipSuccessfulRequests option
      if (ruleConfig.skipSuccessfulRequests && ctx.status < 400) {
        entry.count--;
      }

      // Handle skipFailedRequests option
      if (ruleConfig.skipFailedRequests && ctx.status >= 400) {
        entry.count--;
      }
    } catch (error) {
      // Log error but don't block the request if rate limiting fails
      console.error('[Rate Limit] Error in rate limit middleware:', error);
      return next();
    }
  };
};

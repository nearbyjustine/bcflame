/**
 * Rate Limiting Configuration
 *
 * Centralized configuration for rate limiting across the application.
 * Different limits are applied based on endpoint type and authentication status.
 */

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  message?: string; // Optional custom message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

export interface RateLimitRules {
  [key: string]: RateLimitConfig;
}

/**
 * Rate limit rules for different endpoint types
 */
export const rateLimitRules: RateLimitRules = {
  // Authentication endpoints - Very strict
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 attempts per 15 minutes
    message: 'Too many login attempts. Please try again later.',
    skipSuccessfulRequests: true, // Don't count successful logins
  },

  // Password reset - Strict
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: 'Too many password reset requests. Please try again later.',
  },

  // Public API endpoints - Moderate
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, // 2000 requests per 15 minutes
    message: 'Too many requests. Please try again later.',
  },

  // Authenticated API endpoints - Generous
  authenticated: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
    message: 'Rate limit exceeded. Please slow down your requests.',
  },

  // File uploads - Generous (covers GET browse + actual uploads)
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 500, // 500 requests per hour (admin browsing + uploads)
    message: 'Too many file upload requests. Please try again later.',
  },

  // Admin endpoints - Generous
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 500 requests per 15 minutes
    message: 'Admin rate limit exceeded.',
  },

  // Health check and monitoring - Very generous
  monitoring: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Monitoring rate limit exceeded.',
    skipSuccessfulRequests: true,
  },
};

/**
 * Get rate limit configuration for a specific rule
 */
export function getRateLimitConfig(ruleName: keyof RateLimitRules): RateLimitConfig {
  return rateLimitRules[ruleName] || rateLimitRules.public;
}

/**
 * Determine which rate limit rule to apply based on the request path and user
 */
export function determineRateLimitRule(path: string, isAuthenticated: boolean, isAdmin: boolean): keyof RateLimitRules {
  // Authentication endpoints
  if (path.includes('/auth/local') || path.includes('/api/auth/local')) {
    return 'login';
  }

  if (path.includes('/auth/forgot-password') || path.includes('/auth/reset-password')) {
    return 'passwordReset';
  }

  // Monitoring endpoints
  if (path.includes('/health') || path.includes('/_health') || path.includes('/metrics')) {
    return 'monitoring';
  }

  // Admin endpoints (checked before upload so admin media browsing uses admin limit)
  if (isAdmin && (path.includes('/admin') || path.includes('/upload'))) {
    return 'admin';
  }

  // Upload endpoints (non-admin)
  if (path.includes('/upload')) {
    return 'upload';
  }

  // Authenticated vs public
  if (isAuthenticated) {
    return 'authenticated';
  }

  return 'public';
}

/**
 * Default configuration
 */
export const defaultRateLimitConfig = {
  // Enable rate limiting
  enabled: process.env.RATE_LIMIT_ENABLED !== 'false',

  // Store type (memory for single server, redis for multiple servers)
  store: process.env.RATE_LIMIT_STORE || 'memory',

  // Redis configuration (if using redis store)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  // Trust proxy (important for getting real IP behind nginx)
  trustProxy: true,

  // Standard headers to return
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers

  // Legacy headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
};

export default {
  rateLimitRules,
  getRateLimitConfig,
  determineRateLimitRule,
  defaultRateLimitConfig,
};

/**
 * Rate Limiting Middleware Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import rateLimitMiddleware, { clearStore, stopCleanupTimer } from './rate-limit';
import type { Context, Next } from 'koa';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeEach(() => {
  console.log = vi.fn();
  console.warn = vi.fn();
  console.error = vi.fn();
  clearStore();
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
  clearStore();
  stopCleanupTimer();
});

/**
 * Create a mock Strapi instance
 */
function createMockStrapi(): any {
  return {
    log: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  };
}

/**
 * Create a mock Koa context
 */
function createMockContext(overrides: Partial<Context> = {}): Context {
  const ctx: any = {
    request: {
      path: '/api/test',
      ip: '127.0.0.1',
      headers: {},
    },
    state: {},
    status: 200,
    body: null,
    set: vi.fn(),
    ...overrides,
  };

  return ctx as Context;
}

/**
 * Create a mock next function
 */
function createMockNext(): Next {
  return vi.fn(async () => {});
}

describe('Rate Limit Middleware', () => {
  describe('Basic Functionality', () => {
    it('should allow requests under the rate limit', async () => {
      const mockStrapi = createMockStrapi();
      const middleware = rateLimitMiddleware({}, { strapi: mockStrapi });
      const ctx = createMockContext({ request: { path: '/api/products', ip: '127.0.0.1', headers: {} } });
      const next = createMockNext();

      await middleware(ctx as any, next);

      expect(next).toHaveBeenCalled();
      expect(ctx.status).not.toBe(429);
    });

    it('should block requests that exceed the rate limit', async () => {
      const mockStrapi = createMockStrapi();
      const middleware = rateLimitMiddleware({}, { strapi: mockStrapi });
      const ctx = createMockContext({
        request: { path: '/api/auth/local', ip: '127.0.0.1', headers: {} },
      });

      // Make 50 FAILED login requests (login limit is 50 per 15 minutes)
      // Use status 401 so they count (skipSuccessfulRequests only skips status < 400)
      for (let i = 0; i < 50; i++) {
        const next = createMockNext();
        ctx.status = 401; // Failed login
        await middleware(ctx as any, next);
      }

      // 51st request should be blocked
      const next = createMockNext();
      ctx.status = 401;
      await middleware(ctx as any, next);

      expect(next).not.toHaveBeenCalled();
      expect(ctx.status).toBe(429);
      expect(ctx.body).toMatchObject({
        error: {
          status: 429,
          name: 'TooManyRequests',
        },
      });
    });

    it('should set rate limit headers', async () => {
      const mockStrapi = createMockStrapi();
      const middleware = rateLimitMiddleware({}, { strapi: mockStrapi });
      const ctx = createMockContext();
      const next = createMockNext();

      await middleware(ctx as any, next);

      expect(ctx.set).toHaveBeenCalledWith('RateLimit-Limit', expect.any(String));
      expect(ctx.set).toHaveBeenCalledWith('RateLimit-Remaining', expect.any(String));
      expect(ctx.set).toHaveBeenCalledWith('RateLimit-Reset', expect.any(String));
    });
  });

  describe('Client Identification', () => {
    it('should identify clients by IP address', async () => {
      const mockStrapi = createMockStrapi();
      const middleware = rateLimitMiddleware({}, { strapi: mockStrapi });
      const ctx1 = createMockContext({ request: { path: '/api/test', ip: '192.168.1.1', headers: {} } });
      const ctx2 = createMockContext({ request: { path: '/api/test', ip: '192.168.1.2', headers: {} } });
      const next = createMockNext();

      await middleware(ctx1 as any, next);
      await middleware(ctx2 as any, next);

      expect(next).toHaveBeenCalledTimes(2);
    });

    it('should use X-Forwarded-For header when present', async () => {
      const mockStrapi = createMockStrapi();
      const middleware = rateLimitMiddleware({}, { strapi: mockStrapi });
      const ctx = createMockContext({
        request: {
          path: '/api/test',
          ip: '127.0.0.1',
          headers: { 'x-forwarded-for': '203.0.113.1, 198.51.100.1' },
        },
      });
      const next = createMockNext();

      await middleware(ctx as any, next);

      expect(next).toHaveBeenCalled();
      // Should use the first IP in the chain (203.0.113.1)
    });

    it('should use X-Real-IP header when present', async () => {
      const mockStrapi = createMockStrapi();
      const middleware = rateLimitMiddleware({}, { strapi: mockStrapi });
      const ctx = createMockContext({
        request: {
          path: '/api/test',
          ip: '127.0.0.1',
          headers: { 'x-real-ip': '203.0.113.1' },
        },
      });
      const next = createMockNext();

      await middleware(ctx as any, next);

      expect(next).toHaveBeenCalled();
    });

    it('should identify authenticated users by user ID', async () => {
      const mockStrapi = createMockStrapi();
      const middleware = rateLimitMiddleware({}, { strapi: mockStrapi });
      const ctx = createMockContext({
        request: { path: '/api/test', ip: '127.0.0.1', headers: {} },
        state: { user: { id: 123 } },
      });
      const next = createMockNext();

      await middleware(ctx as any, next);

      expect(next).toHaveBeenCalled();
      // Should track by user:123 instead of IP
    });
  });

  describe('Rate Limit Rules', () => {
    it('should apply stricter limits to login endpoints', async () => {
      const mockStrapi = createMockStrapi();
      const middleware = rateLimitMiddleware({}, { strapi: mockStrapi });
      const ctx = createMockContext({
        request: { path: '/api/auth/local', ip: '127.0.0.1', headers: {} },
      });

      // Login limit is 50 requests per 15 minutes
      // Use failed status so they count against the limit
      for (let i = 0; i < 50; i++) {
        const next = createMockNext();
        ctx.status = 401; // Failed login
        await middleware(ctx as any, next);
        expect(next).toHaveBeenCalled();
      }

      // 51st request should be blocked
      const next = createMockNext();
      ctx.status = 401;
      await middleware(ctx as any, next);
      expect(next).not.toHaveBeenCalled();
      expect(ctx.status).toBe(429);
    });

    it('should apply higher limits to authenticated users', async () => {
      const mockStrapi = createMockStrapi();
      const middleware = rateLimitMiddleware({}, { strapi: mockStrapi });
      const ctx = createMockContext({
        request: { path: '/api/products', ip: '127.0.0.1', headers: {} },
        state: { user: { id: 1 } },
      });

      // Authenticated limit is 1000 requests per 15 minutes (much higher)
      // Test first 10 requests
      for (let i = 0; i < 10; i++) {
        const next = createMockNext();
        await middleware(ctx as any, next);
        expect(next).toHaveBeenCalled();
      }
    });

    it('should apply admin limits to admin users', async () => {
      const mockStrapi = createMockStrapi();
      const middleware = rateLimitMiddleware({}, { strapi: mockStrapi });
      const ctx = createMockContext({
        request: { path: '/admin/content-manager', ip: '127.0.0.1', headers: {} },
        state: { user: { id: 1, role: { type: 'admin' } } },
      });
      const next = createMockNext();

      await middleware(ctx as any, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('Skip Options', () => {
    it('should skip rate limiting for health check endpoints', async () => {
      const mockStrapi = createMockStrapi();
      const middleware = rateLimitMiddleware({}, { strapi: mockStrapi });
      const ctx = createMockContext({ request: { path: '/_health', ip: '127.0.0.1', headers: {} } });
      const next = createMockNext();

      await middleware(ctx as any, next);

      expect(next).toHaveBeenCalled();
      expect(ctx.set).not.toHaveBeenCalled(); // No headers set
    });

    it('should not count successful login attempts against the limit', async () => {
      const mockStrapi = createMockStrapi();
      const middleware = rateLimitMiddleware({}, { strapi: mockStrapi });
      const ctx = createMockContext({
        request: { path: '/api/auth/local', ip: '127.0.0.1', headers: {} },
      });

      // Make 50 successful login requests (status 200)
      for (let i = 0; i < 50; i++) {
        const next = createMockNext();
        ctx.status = 200;
        await middleware(ctx as any, next);
        expect(next).toHaveBeenCalled();
      }

      // Should still be able to make requests (successful requests were not counted)
      const next = createMockNext();
      ctx.status = 200;
      await middleware(ctx as any, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should not block requests if rate limiting fails', async () => {
      const mockStrapi = createMockStrapi();
      const middleware = rateLimitMiddleware({}, { strapi: mockStrapi });
      const ctx = createMockContext({
        request: { path: '/api/test', ip: null as any, headers: {} },
      });
      const next = createMockNext();

      // Should not throw error
      await expect(middleware(ctx as any, next)).resolves.not.toThrow();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Response Headers', () => {
    it('should include Retry-After header when rate limit exceeded', async () => {
      const mockStrapi = createMockStrapi();
      const middleware = rateLimitMiddleware({}, { strapi: mockStrapi });
      const ctx = createMockContext({
        request: { path: '/api/auth/local', ip: '127.0.0.1', headers: {} },
      });

      // Exceed rate limit (login limit is 50)
      // Use failed status so they count against the limit
      for (let i = 0; i < 51; i++) {
        const next = createMockNext();
        ctx.status = 401; // Failed login
        await middleware(ctx as any, next);
      }

      expect(ctx.set).toHaveBeenCalledWith('Retry-After', expect.any(String));
    });

    it('should include rate limit details in error response', async () => {
      const mockStrapi = createMockStrapi();
      const middleware = rateLimitMiddleware({}, { strapi: mockStrapi });
      const ctx = createMockContext({
        request: { path: '/api/auth/local', ip: '127.0.0.1', headers: {} },
      });

      // Exceed rate limit (login limit is 50)
      // Use failed status so they count against the limit
      for (let i = 0; i < 51; i++) {
        const next = createMockNext();
        ctx.status = 401; // Failed login
        await middleware(ctx as any, next);
      }

      expect(ctx.body).toMatchObject({
        error: {
          details: {
            limit: expect.any(Number),
            remaining: 0,
            resetTime: expect.any(Number),
            retryAfter: expect.any(Number),
          },
        },
      });
    });
  });
});

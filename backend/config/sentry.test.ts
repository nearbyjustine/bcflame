import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSentryConfig } from './sentry';

describe('Sentry Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('enabled', () => {
    it('should return disabled config when DSN is not set', () => {
      delete process.env.SENTRY_DSN;

      const config = getSentryConfig();

      expect(config.enabled).toBe(false);
      expect(config.dsn).toBeNull();
    });

    it('should return enabled config when DSN is set', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';

      const config = getSentryConfig();

      expect(config.enabled).toBe(true);
      expect(config.dsn).toBe('https://test@sentry.io/123');
    });
  });

  describe('environment', () => {
    it('should use NODE_ENV for environment if SENTRY_ENVIRONMENT not set', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.NODE_ENV = 'production';
      delete process.env.SENTRY_ENVIRONMENT;

      const config = getSentryConfig();

      expect(config.environment).toBe('production');
    });

    it('should use SENTRY_ENVIRONMENT if set', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.SENTRY_ENVIRONMENT = 'staging';

      const config = getSentryConfig();

      expect(config.environment).toBe('staging');
    });

    it('should default to "development" when NODE_ENV not set', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      delete process.env.NODE_ENV;
      delete process.env.SENTRY_ENVIRONMENT;

      const config = getSentryConfig();

      expect(config.environment).toBe('development');
    });
  });

  describe('release', () => {
    it('should use SENTRY_RELEASE if set', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.SENTRY_RELEASE = 'v1.0.0';

      const config = getSentryConfig();

      expect(config.release).toBe('v1.0.0');
    });

    it('should be undefined when SENTRY_RELEASE not set', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      delete process.env.SENTRY_RELEASE;

      const config = getSentryConfig();

      expect(config.release).toBeUndefined();
    });
  });

  describe('sample rates', () => {
    it('should use production sample rates in production', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.NODE_ENV = 'production';

      const config = getSentryConfig();

      expect(config.tracesSampleRate).toBe(0.1);
      expect(config.profilesSampleRate).toBe(0.1);
    });

    it('should use development sample rates in development', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.NODE_ENV = 'development';

      const config = getSentryConfig();

      expect(config.tracesSampleRate).toBe(1.0);
      expect(config.profilesSampleRate).toBe(0);
    });

    it('should respect custom traces sample rate from env var', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.NODE_ENV = 'production';
      process.env.SENTRY_TRACES_SAMPLE_RATE = '0.5';

      const config = getSentryConfig();

      expect(config.tracesSampleRate).toBe(0.5);
    });

    it('should respect custom profiles sample rate from env var', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.NODE_ENV = 'production';
      process.env.SENTRY_PROFILES_SAMPLE_RATE = '0.2';

      const config = getSentryConfig();

      expect(config.profilesSampleRate).toBe(0.2);
    });
  });

  describe('maxBreadcrumbs', () => {
    it('should default to 100 breadcrumbs', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';

      const config = getSentryConfig();

      expect(config.maxBreadcrumbs).toBe(100);
    });
  });

  describe('beforeSend', () => {
    it('should return null in development by default', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.NODE_ENV = 'development';
      delete process.env.SENTRY_SEND_IN_DEV;

      const config = getSentryConfig();
      const event = {
        message: 'Test error',
        tags: { 'http.status_code': 500 },
      };

      const result = config.beforeSend(event, {});

      expect(result).toBeNull();
    });

    it('should send errors in development when SENTRY_SEND_IN_DEV is true', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.NODE_ENV = 'development';
      process.env.SENTRY_SEND_IN_DEV = 'true';

      const config = getSentryConfig();
      const event = {
        message: 'Test error',
        tags: { 'http.status_code': 500 },
      };

      const result = config.beforeSend(event, {});

      expect(result).toBe(event);
    });

    it('should send errors in production', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.NODE_ENV = 'production';

      const config = getSentryConfig();
      const event = {
        message: 'Internal Server Error',
        tags: { 'http.status_code': 500 },
      };

      const result = config.beforeSend(event, {});

      expect(result).toBe(event);
    });

    it('should filter 404 errors by message', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.NODE_ENV = 'production';

      const config = getSentryConfig();
      const event = {
        message: 'NotFoundError: Resource not found',
        tags: {},
      };

      const result = config.beforeSend(event, {});

      expect(result).toBeNull();
    });

    it('should filter 404 errors by status code tag', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.NODE_ENV = 'production';

      const config = getSentryConfig();
      const event = {
        message: 'Error occurred',
        tags: { 'http.status_code': 404 },
      };

      const result = config.beforeSend(event, {});

      expect(result).toBeNull();
    });

    it('should filter rate limit (429) errors by message', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.NODE_ENV = 'production';

      const config = getSentryConfig();
      const event = {
        message: 'TooManyRequests',
        tags: {},
      };

      const result = config.beforeSend(event, {});

      expect(result).toBeNull();
    });

    it('should filter rate limit (429) errors by status code tag', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.NODE_ENV = 'production';

      const config = getSentryConfig();
      const event = {
        message: 'Error occurred',
        tags: { 'http.status_code': 429 },
      };

      const result = config.beforeSend(event, {});

      expect(result).toBeNull();
    });

    it('should filter validation errors', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.NODE_ENV = 'production';

      const config = getSentryConfig();
      const event = {
        message: 'ValidationError: Invalid input',
        tags: {},
      };

      const result = config.beforeSend(event, {});

      expect(result).toBeNull();
    });

    it('should allow server errors (500)', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.NODE_ENV = 'production';

      const config = getSentryConfig();
      const event = {
        message: 'Internal Server Error',
        tags: { 'http.status_code': 500 },
      };

      const result = config.beforeSend(event, {});

      expect(result).toBe(event);
    });

    it('should allow errors without tags', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.NODE_ENV = 'production';

      const config = getSentryConfig();
      const event = {
        message: 'Unhandled exception',
      };

      const result = config.beforeSend(event, {});

      expect(result).toBe(event);
    });
  });

  describe('beforeBreadcrumb', () => {
    it('should filter health check requests', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';

      const config = getSentryConfig();
      const breadcrumb = {
        category: 'http',
        data: { url: 'http://localhost:1337/_health' },
      };

      const result = config.beforeBreadcrumb(breadcrumb, {});

      expect(result).toBeNull();
    });

    it('should filter admin health check requests', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';

      const config = getSentryConfig();
      const breadcrumb = {
        category: 'http',
        data: { url: 'http://localhost:1337/admin/_health' },
      };

      const result = config.beforeBreadcrumb(breadcrumb, {});

      expect(result).toBeNull();
    });

    it('should scrub authorization header', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';

      const config = getSentryConfig();
      const breadcrumb = {
        category: 'http',
        data: {
          url: 'http://localhost:1337/api/test',
          headers: {
            authorization: 'Bearer secret-token',
            cookie: 'session=secret',
            'user-agent': 'test-agent',
          },
        },
      };

      const result = config.beforeBreadcrumb(breadcrumb, {});

      expect(result).not.toBeNull();
      expect(result?.data?.headers?.authorization).toBeUndefined();
      expect(result?.data?.headers?.cookie).toBeUndefined();
      expect(result?.data?.headers?.['user-agent']).toBe('test-agent');
    });

    it('should allow breadcrumbs without headers', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';

      const config = getSentryConfig();
      const breadcrumb = {
        category: 'navigation',
        message: 'User navigated to dashboard',
        data: { from: '/login', to: '/dashboard' },
      };

      const result = config.beforeBreadcrumb(breadcrumb, {});

      expect(result).toEqual(breadcrumb);
    });

    it('should allow non-http breadcrumbs', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';

      const config = getSentryConfig();
      const breadcrumb = {
        category: 'console',
        message: 'Log message',
        level: 'info',
      };

      const result = config.beforeBreadcrumb(breadcrumb, {});

      expect(result).toEqual(breadcrumb);
    });

    it('should handle breadcrumb without data', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';

      const config = getSentryConfig();
      const breadcrumb = {
        category: 'http',
        message: 'Request sent',
      };

      const result = config.beforeBreadcrumb(breadcrumb, {});

      expect(result).toEqual(breadcrumb);
    });
  });
});

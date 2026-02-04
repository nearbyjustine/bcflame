import { describe, it, expect, vi, beforeEach } from 'vitest';
import loggingMiddleware from './logging';

describe('Logging Middleware', () => {
  let mockContext: any;
  let mockNext: any;
  let mockStrapi: any;
  let startTime: number;

  beforeEach(() => {
    startTime = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(startTime);

    mockNext = vi.fn().mockResolvedValue(undefined);
    mockStrapi = {
      log: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    };

    mockContext = {
      request: {
        method: 'GET',
        path: '/api/products',
        ip: '127.0.0.1',
        headers: {
          'user-agent': 'Mozilla/5.0',
        },
      },
      response: {
        status: 200,
      },
      state: {
        correlationId: 'test-correlation-id',
        user: {
          id: 123,
        },
      },
    };
  });

  it('should log incoming request with correlation ID', async () => {
    const middleware = loggingMiddleware({}, { strapi: mockStrapi });

    await middleware(mockContext, mockNext);

    expect(mockStrapi.log.info).toHaveBeenCalledWith(
      '[test-correlation-id] → GET /api/products',
      {
        userId: 123,
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      }
    );
  });

  it('should log response with duration', async () => {
    const middleware = loggingMiddleware({}, { strapi: mockStrapi });

    // Mock time passing (100ms)
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(startTime) // Request start
      .mockReturnValueOnce(startTime + 100); // Response end

    await middleware(mockContext, mockNext);

    expect(mockStrapi.log.info).toHaveBeenCalledWith(
      '[test-correlation-id] ← GET /api/products 200 (100ms)',
      {
        status: 200,
        duration: 100,
        userId: 123,
      }
    );
  });

  it('should use anonymous for userId when no user in state', async () => {
    mockContext.state.user = undefined;
    const middleware = loggingMiddleware({}, { strapi: mockStrapi });

    await middleware(mockContext, mockNext);

    expect(mockStrapi.log.info).toHaveBeenCalledWith(
      '[test-correlation-id] → GET /api/products',
      expect.objectContaining({
        userId: 'anonymous',
      })
    );
  });

  it('should use N/A for correlation ID when not present', async () => {
    mockContext.state.correlationId = undefined;
    const middleware = loggingMiddleware({}, { strapi: mockStrapi });

    await middleware(mockContext, mockNext);

    expect(mockStrapi.log.info).toHaveBeenCalledWith(
      '[N/A] → GET /api/products',
      expect.anything()
    );
  });

  it('should log 4xx responses with warn level', async () => {
    mockContext.response.status = 404;
    const middleware = loggingMiddleware({}, { strapi: mockStrapi });

    await middleware(mockContext, mockNext);

    expect(mockStrapi.log.warn).toHaveBeenCalledWith(
      '[test-correlation-id] ← GET /api/products 404 (0ms)',
      expect.objectContaining({
        status: 404,
      })
    );
  });

  it('should log 5xx responses with error level', async () => {
    mockContext.response.status = 500;
    const middleware = loggingMiddleware({}, { strapi: mockStrapi });

    await middleware(mockContext, mockNext);

    expect(mockStrapi.log.error).toHaveBeenCalledWith(
      '[test-correlation-id] ← GET /api/products 500 (0ms)',
      expect.objectContaining({
        status: 500,
      })
    );
  });

  it('should skip logging for paths in skipPaths config', async () => {
    const middleware = loggingMiddleware(
      { skipPaths: ['/_health', '/admin'] },
      { strapi: mockStrapi }
    );

    mockContext.request.path = '/_health';

    await middleware(mockContext, mockNext);

    // Should not log anything
    expect(mockStrapi.log.info).not.toHaveBeenCalled();
    expect(mockStrapi.log.warn).not.toHaveBeenCalled();
    expect(mockStrapi.log.error).not.toHaveBeenCalled();

    // Should still call next
    expect(mockNext).toHaveBeenCalled();
  });

  it('should skip logging for admin paths when configured', async () => {
    const middleware = loggingMiddleware(
      { skipPaths: ['/admin'] },
      { strapi: mockStrapi }
    );

    mockContext.request.path = '/admin/content-manager/collection-types';

    await middleware(mockContext, mockNext);

    // Should not log
    expect(mockStrapi.log.info).not.toHaveBeenCalled();
  });

  it('should log even when error occurs in next middleware', async () => {
    const error = new Error('Test error');
    mockNext = vi.fn().mockRejectedValue(error);
    mockContext.response.status = 500;

    const middleware = loggingMiddleware({}, { strapi: mockStrapi });

    await expect(middleware(mockContext, mockNext)).rejects.toThrow('Test error');

    // Should still log response
    expect(mockStrapi.log.error).toHaveBeenCalled();
  });

  it('should handle missing user-agent header', async () => {
    mockContext.request.headers = {};
    const middleware = loggingMiddleware({}, { strapi: mockStrapi });

    await middleware(mockContext, mockNext);

    expect(mockStrapi.log.info).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        userAgent: undefined,
      })
    );
  });

  it('should use default skipPaths if not configured', async () => {
    const middleware = loggingMiddleware(null, { strapi: mockStrapi });

    await middleware(mockContext, mockNext);

    // Should log normally
    expect(mockStrapi.log.info).toHaveBeenCalled();
  });
});

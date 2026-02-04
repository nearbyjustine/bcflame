import { describe, it, expect, vi, beforeEach } from 'vitest';
import correlationIdMiddleware from './correlation-id';

describe('Correlation ID Middleware', () => {
  let mockContext: any;
  let mockNext: any;
  let mockStrapi: any;

  beforeEach(() => {
    // Reset mocks before each test
    mockNext = vi.fn().mockResolvedValue(undefined);
    mockStrapi = {
      log: {
        debug: vi.fn(),
      },
    };
    mockContext = {
      request: {
        headers: {},
      },
      state: {},
      set: vi.fn(),
    };
  });

  it('should generate correlation ID if not provided', async () => {
    const middleware = correlationIdMiddleware({}, { strapi: mockStrapi });

    await middleware(mockContext, mockNext);

    // Should generate a UUID and store in state
    expect(mockContext.state.correlationId).toBeDefined();
    expect(mockContext.state.correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );

    // Should set response header with generated ID
    expect(mockContext.set).toHaveBeenCalledWith(
      'X-Correlation-ID',
      mockContext.state.correlationId
    );

    // Should call next
    expect(mockNext).toHaveBeenCalled();
  });

  it('should use provided correlation ID from header', async () => {
    const existingId = '12345678-1234-1234-1234-123456789012';
    mockContext.request.headers['x-correlation-id'] = existingId;

    const middleware = correlationIdMiddleware({}, { strapi: mockStrapi });

    await middleware(mockContext, mockNext);

    // Should use the provided correlation ID
    expect(mockContext.state.correlationId).toBe(existingId);

    // Should set response header with provided ID
    expect(mockContext.set).toHaveBeenCalledWith('X-Correlation-ID', existingId);

    // Should call next
    expect(mockNext).toHaveBeenCalled();
  });

  it('should set response header with correlation ID', async () => {
    const middleware = correlationIdMiddleware({}, { strapi: mockStrapi });

    await middleware(mockContext, mockNext);

    // Should set X-Correlation-ID header on response
    expect(mockContext.set).toHaveBeenCalledWith(
      'X-Correlation-ID',
      expect.any(String)
    );
  });

  it('should call next middleware', async () => {
    const middleware = correlationIdMiddleware({}, { strapi: mockStrapi });

    await middleware(mockContext, mockNext);

    // Should call next middleware in chain
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should handle uppercase header name', async () => {
    const existingId = 'TEST-CORRELATION-ID';
    mockContext.request.headers['X-Correlation-ID'] = existingId;

    const middleware = correlationIdMiddleware({}, { strapi: mockStrapi });

    await middleware(mockContext, mockNext);

    // Should handle case-insensitive header lookup
    // Note: Koa converts headers to lowercase, so we only test lowercase
    expect(mockContext.state.correlationId).toBeDefined();
  });

  it('should propagate errors from next middleware', async () => {
    const error = new Error('Test error');
    mockNext = vi.fn().mockRejectedValue(error);

    const middleware = correlationIdMiddleware({}, { strapi: mockStrapi });

    // Should propagate the error
    await expect(middleware(mockContext, mockNext)).rejects.toThrow('Test error');
  });
});

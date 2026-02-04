import { describe, it, expect, vi, beforeEach } from 'vitest';
import { instrumentOperation, createSpan, addBreadcrumb } from './sentry-helpers';
import * as SentryModule from '../instrumentation';

// Mock Sentry
vi.mock('../instrumentation', () => {
  return {
    Sentry: {
      startSpan: vi.fn((config, fn) => fn({ setStatus: vi.fn() })),
      setContext: vi.fn(),
      addBreadcrumb: vi.fn(),
      captureException: vi.fn(),
    },
    isEnabled: vi.fn(() => true),
  };
});

describe('Sentry Helpers', () => {
  const Sentry = SentryModule.Sentry as any;
  const isEnabled = SentryModule.isEnabled as any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isEnabled).mockReturnValue(true);
  });

  describe('instrumentOperation', () => {
    it('should execute function and return result when Sentry enabled', async () => {
      const mockSpan = { setStatus: vi.fn() };
      Sentry.startSpan.mockImplementation(async (_config: any, fn: any) => fn(mockSpan));

      const testFn = vi.fn().mockResolvedValue('test-result');
      const result = await instrumentOperation('test.operation', testFn, {
        test: 'context',
      });

      expect(result).toBe('test-result');
      expect(Sentry.startSpan).toHaveBeenCalledWith(
        { op: 'task', name: 'test.operation' },
        expect.any(Function)
      );
      expect(Sentry.setContext).toHaveBeenCalledWith('operation', {
        operation: 'test.operation',
        test: 'context',
      });
      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: 1, message: 'ok' });
    });

    it('should capture exception on error', async () => {
      const mockSpan = { setStatus: vi.fn() };
      Sentry.startSpan.mockImplementation(async (_config: any, fn: any) => fn(mockSpan));

      const error = new Error('Test error');
      const testFn = vi.fn().mockRejectedValue(error);

      await expect(instrumentOperation('test.operation', testFn)).rejects.toThrow(
        'Test error'
      );

      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: 2, message: 'internal_error' });
      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        tags: { operation: 'test.operation' },
      });
    });

    it('should include context in error tags', async () => {
      const mockSpan = { setStatus: vi.fn() };
      Sentry.startSpan.mockImplementation(async (_config: any, fn: any) => fn(mockSpan));

      const error = new Error('Test error');
      const testFn = vi.fn().mockRejectedValue(error);
      const context = { userId: '123', orderNumber: 'ORD-001' };

      await expect(
        instrumentOperation('order.create', testFn, context)
      ).rejects.toThrow('Test error');

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        tags: {
          operation: 'order.create',
          ...context,
        },
      });
    });

    it('should skip instrumentation if Sentry disabled', async () => {
      vi.mocked(isEnabled).mockReturnValue(false);

      const testFn = vi.fn().mockResolvedValue('test-result');
      const result = await instrumentOperation('test.operation', testFn);

      expect(result).toBe('test-result');
      expect(Sentry.startSpan).not.toHaveBeenCalled();
      expect(testFn).toHaveBeenCalled();
    });

    it('should work without context parameter', async () => {
      const mockSpan = { setStatus: vi.fn() };
      Sentry.startSpan.mockImplementation(async (_config: any, fn: any) => fn(mockSpan));

      const testFn = vi.fn().mockResolvedValue('success');
      const result = await instrumentOperation('test.operation', testFn);

      expect(result).toBe('success');
      expect(Sentry.setContext).not.toHaveBeenCalled();
      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: 1, message: 'ok' });
    });

    it('should set internal_error status on span even if error thrown', async () => {
      const mockSpan = { setStatus: vi.fn() };
      Sentry.startSpan.mockImplementation(async (_config: any, fn: any) => fn(mockSpan));

      const testFn = vi.fn().mockRejectedValue(new Error('Test'));

      await expect(instrumentOperation('test.op', testFn)).rejects.toThrow();

      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: 2, message: 'internal_error' });
    });
  });

  describe('createSpan', () => {
    it('should create span and execute function', async () => {
      const testFn = vi.fn().mockResolvedValue('span-result');
      Sentry.startSpan.mockImplementation(async (config: any, fn: any) => await fn());

      const result = await createSpan('test.span', testFn);

      expect(result).toBe('span-result');
      expect(Sentry.startSpan).toHaveBeenCalledWith(
        { op: 'test.span', name: 'test.span' },
        expect.any(Function)
      );
    });

    it('should skip span if Sentry disabled', async () => {
      vi.mocked(isEnabled).mockReturnValue(false);

      const testFn = vi.fn().mockResolvedValue('span-result');
      const result = await createSpan('test.span', testFn);

      expect(result).toBe('span-result');
      expect(Sentry.startSpan).not.toHaveBeenCalled();
      expect(testFn).toHaveBeenCalled();
    });

    it('should propagate errors from function', async () => {
      const error = new Error('Span error');
      const testFn = vi.fn().mockRejectedValue(error);
      Sentry.startSpan.mockImplementation(async (config: any, fn: any) => await fn());

      await expect(createSpan('test.span', testFn)).rejects.toThrow('Span error');
    });

    it('should handle synchronous functions', async () => {
      const testFn = vi.fn().mockResolvedValue('sync-result');
      Sentry.startSpan.mockImplementation(async (config: any, fn: any) => await fn());

      const result = await createSpan('sync.span', testFn);

      expect(result).toBe('sync-result');
    });
  });

  describe('addBreadcrumb', () => {
    it('should add breadcrumb with correct data', () => {
      addBreadcrumb('test-category', 'test message', { key: 'value' });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'test-category',
        message: 'test message',
        level: 'info',
        data: { key: 'value' },
      });
    });

    it('should skip breadcrumb if Sentry disabled', () => {
      vi.mocked(isEnabled).mockReturnValue(false);

      addBreadcrumb('test-category', 'test message');

      expect(Sentry.addBreadcrumb).not.toHaveBeenCalled();
    });

    it('should work without data parameter', () => {
      addBreadcrumb('category', 'message');

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'category',
        message: 'message',
        level: 'info',
        data: undefined,
      });
    });

    it('should handle empty data object', () => {
      addBreadcrumb('category', 'message', {});

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'category',
        message: 'message',
        level: 'info',
        data: {},
      });
    });

    it('should handle complex data objects', () => {
      const complexData = {
        userId: 123,
        action: 'order.create',
        metadata: {
          orderNumber: 'ORD-001',
          items: 5,
        },
      };

      addBreadcrumb('order', 'Order created', complexData);

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'order',
        message: 'Order created',
        level: 'info',
        data: complexData,
      });
    });
  });
});

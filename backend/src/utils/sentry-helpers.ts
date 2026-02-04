/**
 * Sentry Helper Functions
 *
 * Utility functions for instrumenting critical operations with Sentry
 * performance monitoring and error tracking.
 */

import { Sentry, isEnabled } from '../instrumentation';

/**
 * Instrument a critical operation with Sentry transaction
 *
 * Creates a Sentry transaction to track performance of async operations.
 * Automatically captures exceptions and sets transaction status.
 *
 * @param operation - Operation name (e.g., 'order.create', 'invoice.generate')
 * @param fn - Async function to instrument
 * @param context - Additional context to attach to transaction (optional)
 * @returns Result of the function
 *
 * @example
 * ```typescript
 * const result = await instrumentOperation('order.create', async () => {
 *   return await createOrder(orderData);
 * }, { userId: '123', orderNumber: 'ORD-001' });
 * ```
 */
export async function instrumentOperation<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  if (!isEnabled()) {
    return fn();
  }

  return Sentry.startSpan(
    { op: 'task', name: operation },
    async (span) => {
      if (context) {
        Sentry.setContext('operation', { operation, ...context });
      }

      try {
        const result = await fn();
        span.setStatus({ code: 1, message: 'ok' });
        return result;
      } catch (error) {
        span.setStatus({ code: 2, message: 'internal_error' });
        Sentry.captureException(error, {
          tags: {
            operation,
            ...context,
          },
        });
        throw error;
      }
    }
  );
}

/**
 * Create a Sentry span for a sub-operation
 *
 * Creates a performance span to track a specific part of a larger operation.
 * Use this to measure performance of individual steps (e.g., database queries, API calls).
 *
 * @param operation - Span name (e.g., 'db.query', 'email.send', 'pdf.generate')
 * @param fn - Async function to instrument
 * @returns Result of the function
 *
 * @example
 * ```typescript
 * const emailResult = await createSpan('email.send', async () => {
 *   return await sendEmail(options);
 * });
 * ```
 */
export async function createSpan<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  if (!isEnabled()) {
    return fn();
  }

  return Sentry.startSpan(
    { op: operation, name: operation },
    async () => await fn()
  );
}

/**
 * Add a breadcrumb for tracking application flow
 *
 * Breadcrumbs are events that lead up to an error. They help trace
 * the sequence of actions that caused a problem.
 *
 * @param category - Breadcrumb category (e.g., 'order', 'email', 'payment', 'auth')
 * @param message - Breadcrumb message describing the event
 * @param data - Additional data to attach (optional)
 *
 * @example
 * ```typescript
 * addBreadcrumb('order', 'Order inquiry created', {
 *   inquiryNumber: 'INQ-20240129-1234',
 *   customerId: 123,
 * });
 * ```
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, any>
): void {
  if (!isEnabled()) {
    return;
  }

  Sentry.addBreadcrumb({
    category,
    message,
    level: 'info',
    data,
  });
}

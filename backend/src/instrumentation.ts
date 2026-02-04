/**
 * Sentry Instrumentation
 *
 * CRITICAL: This file MUST be imported FIRST before any other application code.
 * It initializes Sentry with auto-instrumentation for Node.js, Koa, PostgreSQL, and HTTP.
 *
 * Import this file at the very top of src/index.ts:
 * import './instrumentation';
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { getSentryConfig } from '../config/sentry';

// Get configuration
const config = getSentryConfig();

// Initialize Sentry if enabled
if (config.enabled) {
  Sentry.init({
    dsn: config.dsn as string,
    environment: config.environment,
    release: config.release,

    // Performance Monitoring
    tracesSampleRate: config.tracesSampleRate,
    profilesSampleRate: config.profilesSampleRate,

    // Integrations
    integrations: [
      // Node profiling integration for performance monitoring
      nodeProfilingIntegration(),
      // Koa integration for automatic request tracking
      Sentry.koaIntegration(),
      // PostgreSQL integration for database query tracking
      Sentry.postgresIntegration(),
      // HTTP integration for outgoing HTTP request tracking
      Sentry.httpIntegration(),
    ],

    // Error filtering
    beforeSend: config.beforeSend,

    // Breadcrumbs
    beforeBreadcrumb: config.beforeBreadcrumb,
    maxBreadcrumbs: config.maxBreadcrumbs,
  });

  console.log(`[Sentry] Initialized in ${config.environment} environment`);
  console.log(`[Sentry] Traces sample rate: ${config.tracesSampleRate * 100}%`);
  console.log(`[Sentry] Profiles sample rate: ${config.profilesSampleRate * 100}%`);
} else {
  console.log('[Sentry] Not initialized - DSN not provided');
}

// Helper function to check if Sentry is enabled
const isEnabled = (): boolean => config.enabled;

// Export Sentry instance and helper for use in other modules
export { Sentry, isEnabled };

/**
 * Sentry Configuration
 *
 * Centralized Sentry configuration with environment-aware settings.
 * This configuration is used by the instrumentation file to initialize Sentry.
 */

export interface SentryConfig {
  enabled: boolean;
  dsn: string | null;
  environment: string;
  release: string | undefined;
  tracesSampleRate: number;
  profilesSampleRate: number;
  maxBreadcrumbs: number;
  beforeSend: (event: any, hint: any) => any | null;
  beforeBreadcrumb: (breadcrumb: any, hint: any) => any | null;
}

/**
 * Get Sentry configuration based on environment variables
 *
 * @returns Sentry configuration object
 */
export const getSentryConfig = (): SentryConfig => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const sentryDsn = process.env.SENTRY_DSN || null;
  const sentryEnvironment = process.env.SENTRY_ENVIRONMENT || nodeEnv;
  const sentryRelease = process.env.SENTRY_RELEASE || undefined;

  // Enable Sentry only if DSN is provided
  const enabled = !!sentryDsn;

  return {
    enabled,
    dsn: sentryDsn,
    environment: sentryEnvironment,
    release: sentryRelease,

    // Performance Monitoring Sample Rates
    tracesSampleRate:
      nodeEnv === 'production'
        ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1') // 10% in production
        : 1.0, // 100% in development

    profilesSampleRate:
      nodeEnv === 'production'
        ? parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1') // 10% in production
        : 0, // Disabled in development

    maxBreadcrumbs: 100,

    // Error Filtering
    beforeSend: (event, hint) => {
      // Don't send errors in development (unless explicitly enabled)
      if (nodeEnv === 'development' && !process.env.SENTRY_SEND_IN_DEV) {
        console.log('[Sentry] Would send error:', event);
        return null;
      }

      // Filter out specific error types

      // Don't send 404 errors
      if (
        event.message?.includes('NotFoundError') ||
        event.tags?.['http.status_code'] === 404
      ) {
        return null;
      }

      // Don't send rate limit errors (they're expected)
      if (
        event.message?.includes('TooManyRequests') ||
        event.tags?.['http.status_code'] === 429
      ) {
        return null;
      }

      // Don't send validation errors (client errors)
      if (event.message?.includes('ValidationError')) {
        return null;
      }

      return event;
    },

    // Breadcrumb Filtering
    beforeBreadcrumb: (breadcrumb, hint) => {
      // Filter out health check requests
      if (
        breadcrumb.category === 'http' &&
        breadcrumb.data?.url?.includes('/_health')
      ) {
        return null;
      }

      // Scrub sensitive data from breadcrumbs
      if (breadcrumb.data?.headers) {
        delete breadcrumb.data.headers.authorization;
        delete breadcrumb.data.headers.cookie;
      }

      return breadcrumb;
    },
  };
};

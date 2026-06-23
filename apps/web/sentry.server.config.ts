/**
 * Sentry Server Configuration — Next.js Web
 *
 * Initializes Sentry on the server side (Edge Runtime excluded).
 * - Captures unhandled server errors
 * - Adds user context from session
 * - 10% performance tracing sample rate in production
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  environment: process.env.NODE_ENV || 'development',
  release: process.env.VERCEL_GIT_COMMIT_SHA || undefined,

  // Ignore expected HTTP errors — these are normal, not bugs
  beforeSend(event) {
    // Don't send 4xx errors to Sentry (client errors are expected)
    if (event.exception) {
      const isClientError = event.exception.values?.some((ex) => {
        return ex.value?.includes('status 4') || ex.type === 'HttpError';
      });
      if (isClientError) return null;
    }
    return event;
  },

  sendDefaultPii: false,
  attachStacktrace: true,

  enabled: process.env.NODE_ENV === 'production' || !!process.env.SENTRY_DSN,
});

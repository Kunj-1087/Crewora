/**
 * Sentry Client Configuration — Next.js Web
 *
 * Initializes Sentry on the browser side.
 * - Captures JS errors
 * - 10% performance tracing sample rate in production
 * - Attaches release and environment tags
 * - Never captures PII (user IDs only, no phones/names)
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,

  // Performance monitoring: 10% sample rate in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Replay sampling: capture 10% of sessions in production for debugging
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  environment: process.env.NODE_ENV || 'development',
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || undefined,

  // Ignore expected errors
  ignoreErrors: [
    'NetworkError',
    'AbortError',
    'ChunkLoadError',
    // Next.js router cancellations
    'canceled',
    'Cancelled',
    // PPC-specific: user aborted navigation
    'The user aborted a request',
  ],

  // Don't send PII
  sendDefaultPii: false,

  // Attach request details but not body
  attachStacktrace: true,

  enabled: process.env.NODE_ENV === 'production' || !!process.env.SENTRY_DSN,
});

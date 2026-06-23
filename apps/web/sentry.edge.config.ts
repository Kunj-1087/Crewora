/**
 * Sentry Edge Configuration — Next.js Web
 *
 * Initializes Sentry for the Edge Runtime (middleware, edge API routes).
 * Minimal config — edge runtime has limited API surface.
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  environment: process.env.NODE_ENV || 'development',
  release: process.env.VERCEL_GIT_COMMIT_SHA || undefined,

  // Edge runtime: lighter trace sampling
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  sendDefaultPii: false,

  enabled: process.env.NODE_ENV === 'production' || !!process.env.SENTRY_DSN,
});

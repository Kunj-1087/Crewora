/**
 * Sentry Client Configuration — Mobile (React Native / Capacitor)
 *
 * Initializes Sentry for the mobile app.
 * - Captures JS crashes and native crashes
 * - Adds user context on login, clears on logout
 * - Breadcrumbs for navigation and API calls (URLs only)
 */

import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: 0.1,

  environment: process.env.NODE_ENV || 'development',

  // Ignore expected errors
  ignoreErrors: [
    'NetworkError',
    'AbortError',
    'ChunkLoadError',
    'canceled',
    'Cancelled',
    'Non-Error exception captured',
  ],

  sendDefaultPii: false,
  attachStacktrace: true,

  enabled: process.env.NODE_ENV === 'production' || !!process.env.SENTRY_DSN,
});

/**
 * Set the authenticated user context (call on login).
 * Never includes PII like phone number or full name — only user ID and role.
 */
export function setSentryUser(userId: string, role: string): void {
  Sentry.setUser({
    id: userId,
    // role only, not username/email/phone
    data: { role },
  });
}

/**
 * Clear the user context (call on logout).
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

/**
 * Add a navigation breadcrumb.
 */
export function addNavigationBreadcrumb(from: string, to: string): void {
  Sentry.addBreadcrumb({
    category: 'navigation',
    message: `Navigated from ${from} to ${to}`,
    level: 'info',
  });
}

/**
 * Add an API call breadcrumb (URL only, no request/response bodies).
 */
export function addApiBreadcrumb(method: string, url: string, statusCode?: number): void {
  Sentry.addBreadcrumb({
    category: 'api',
    message: `${method} ${url}`,
    data: { statusCode },
    level: 'info',
  });
}

export default Sentry;

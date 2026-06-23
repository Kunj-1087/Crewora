/**
 * Sentry Error Tracking — Mobile Utility
 *
 * Thin wrapper around the already-initialized Sentry instance.
 * Sentry is initialized by the root config (sentry.client.config.ts),
 * so this file does NOT call Sentry.init() again.
 *
 * Provides typed helpers for setting user context, adding breadcrumbs,
 * and capturing exceptions with consistent tags.
 */

import * as Sentry from '@sentry/nextjs';

// ─── User Context ────────────────────────────────────────────────────────────

/**
 * Set the authenticated user on the Sentry scope.
 * Only includes user_id and role — NEVER PII like phone or email.
 */
export function setSentryUser(userId: string, role: string): void {
  Sentry.setUser({ id: userId, data: { role } });
}

/** Clear the Sentry user scope (on logout). */
export function clearSentryUser(): void {
  Sentry.getCurrentScope()?.setUser(null);
}

/** Set a custom tag on the Sentry scope. */
export function setSentryTag(name: string, value: string): void {
  Sentry.setTag(name, value);
}

// ─── Breadcrumbs ─────────────────────────────────────────────────────────────

/** Add a navigation breadcrumb. */
export function addNavigationBreadcrumb(from: string, to: string): void {
  Sentry.addBreadcrumb({
    category: 'navigation',
    message: `Navigated from ${from} to ${to}`,
    level: 'info',
  });
}

/** Add an API call breadcrumb (URL + method + status only — no request/response body). */
export function addApiBreadcrumb(method: string, url: string, statusCode?: number): void {
  Sentry.addBreadcrumb({
    category: 'api',
    message: `${method} ${url}`,
    data: { statusCode },
    level: 'info',
  });
}

/** Add an auth event breadcrumb. */
export function addAuthBreadcrumb(event: 'OTP_SENT' | 'OTP_VERIFIED' | 'TOKEN_REFRESHED' | 'LOGOUT'): void {
  Sentry.addBreadcrumb({
    category: 'auth',
    message: event,
    level: 'info',
  });
}

/** Add a user action breadcrumb. */
export function addActionBreadcrumb(
  action: 'REQUEST_CREATED' | 'APPLICATION_SUBMITTED' | 'APPLICATION_ACCEPTED' | 'REVIEW_SUBMITTED',
): void {
  Sentry.addBreadcrumb({
    category: 'user_action',
    message: action,
    level: 'info',
  });
}

// ─── Capture ─────────────────────────────────────────────────────────────────

/** Capture an exception with additional context. */
export function captureException(
  error: unknown,
  context?: { tags?: Record<string, string>; extra?: Record<string, unknown> },
): void {
  Sentry.withScope((scope) => {
    if (context?.tags) scope.setTags(context.tags);
    if (context?.extra) scope.setExtras(context.extra);
    Sentry.captureException(error);
  });
}

export default Sentry;

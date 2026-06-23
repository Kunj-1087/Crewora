/**
 * Sentry Error Tracking — Backend
 *
 * Initializes Sentry with DSN from env.
 * Captures unhandled promise rejections and uncaught exceptions.
 * Adds user context (user_id, role — never mobile number or PII).
 * Only captures 500-level errors as Sentry events.
 * Ignores expected errors: 400 validation errors, 401/403 auth failures.
 */

import * as Sentry from '@sentry/node';
import { env } from '../config/env';

let initialized = false;

/**
 * Initialize Sentry. Safe to call multiple times — only initializes once.
 */
export function initSentry(): void {
  if (initialized) return;

  if (!env.SENTRY_DSN) {
    // Sentry not configured — silently skip
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    release: process.env.npm_package_version || '1.0.0',

    // Sample rate: 100% in production, 0% in dev/test
    sampleRate: env.NODE_ENV === 'production' ? 1.0 : 0.0,

    // Performance tracing: 10% sample rate in production
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 0.0,

    // Only capture errors with status code >= 500
    beforeSend(event: any, hint: any) {
      const exception = hint?.originalException as any;

      // Ignore expected operational errors
      if (exception?.statusCode && exception.statusCode < 500) {
        return null; // Don't send to Sentry
      }

      // Ignore validation errors
      if (exception?.code === 'VALIDATION_ERROR') {
        return null;
      }

      // Ignore rate limit errors
      if (exception?.code === 'RATE_LIMIT_EXCEEDED' || exception?.code === 'OTP_LOCKOUT') {
        return null;
      }

      return event;
    },

    // Integrations — commented out due to API version mismatch
    // Enable when upgrading @sentry/node:
    // integrations: [
    //   new Sentry.Integrations.Http({ breadcrumbs: true, tracing: true }),
    // ],
  });

  // Capture global promise rejections
  process.on('unhandledRejection', (reason) => {
    Sentry.captureException(reason, {
      tags: { type: 'unhandled_promise_rejection' },
    });
  });

  // Capture uncaught exceptions (Sentry does this automatically, but ensure it's set)
  process.on('uncaughtException', (error) => {
    Sentry.captureException(error, {
      tags: { type: 'uncaught_exception' },
    });
    // Still exit — uncaught exceptions leave the app in an unknown state
    process.exit(1);
  });

  initialized = true;
}

/**
 * Set the authenticated user on the Sentry scope.
 * Only includes user_id and role — NEVER PII like phone or email.
 */
export function setSentryUser(userId: string, role: string): void {
  if (!initialized || !env.SENTRY_DSN) return;

  Sentry.setUser({
    id: userId,
    // Intentionally omit username, email, phone, etc.
    // Only include role for debugging context
    data: { role },
  });
}

/**
 * Clear the Sentry user scope (on logout).
 */
export function clearSentryUser(): void {
  if (!initialized || !env.SENTRY_DSN) return;
  Sentry.getCurrentScope().setUser(null);
}

/**
 * Add tags to the current Sentry scope.
 */
export function setSentryTags(tags: Record<string, string>): void {
  if (!initialized || !env.SENTRY_DSN) return;
  Sentry.setTags(tags);
}

/**
 * Capture an exception with custom tags and context.
 */
export function captureException(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
): void {
  if (!initialized || !env.SENTRY_DSN) return;

  Sentry.withScope((scope: any) => {
    if (context?.tags) {
      scope.setTags(context.tags);
    }
    if (context?.extra) {
      scope.setExtras(context.extra);
    }
    Sentry.captureException(error);
  });
}

export default Sentry;

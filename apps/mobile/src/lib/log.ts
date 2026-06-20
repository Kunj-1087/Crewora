/**
 * Lightweight logging sink.
 *
 * In development it forwards to the console; in production builds it stays silent
 * (so no sensitive data leaks to device logs — spec §5 Security). `logError` is the
 * single extension point where a crash reporter (e.g. Sentry) would be wired in.
 */

export const isDev = process.env.NODE_ENV !== 'production';

export function logDebug(...args: unknown[]): void {
  if (isDev) console.log(...args);
}

export function logWarn(...args: unknown[]): void {
  if (isDev) console.warn(...args);
}

export function logError(error: unknown, context?: string): void {
  if (isDev) {
    console.error(context ? `[${context}]` : '[error]', error);
  }
  // Production crash reporting hook — attach Sentry/Crashlytics here:
  // Sentry.captureException(error, { tags: { context } });
}

/**
 * Production Logger
 *
 * Wraps all console output with automatic sanitization.
 * In production: suppresses ALL console.log calls (debug, info).
 * In development: passes through sanitized output.
 *
 * Every log statement should use this wrapper — never raw console.log.
 */

import { sanitizeForLog } from './logSanitizer';

const isDev = process.env.NODE_ENV !== 'production';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Internal log dispatcher.
 * In production: only 'warn' and 'error' reach the console.
 * All strings are sanitized before output.
 */
function log(level: LogLevel, message: string, data?: unknown): void {
  if (!isDev && level === 'debug') return;
  if (!isDev && level === 'info') return;

  const sanitizedMsg = sanitizeForLog(message);
  const entry = data ? sanitizeForLog(data) : '';

  switch (level) {
    case 'debug':
      console.debug(`[DBG] ${sanitizedMsg}`, entry);
      break;
    case 'info':
      console.info(`[INF] ${sanitizedMsg}`, entry);
      break;
    case 'warn':
      console.warn(`[WRN] ${sanitizedMsg}`, entry);
      break;
    case 'error':
      console.error(`[ERR] ${sanitizedMsg}`, entry);
      break;
  }
}

export const logger = {
  debug: (message: string, data?: unknown) => log('debug', message, data),
  info: (message: string, data?: unknown) => log('info', message, data),
  warn: (message: string, data?: unknown) => log('warn', message, data),
  error: (message: string, data?: unknown) => log('error', message, data),

  /**
   * Log an Error object with context.
   * Always logs in both dev and prod (as error).
   */
  exception: (error: unknown, context?: string): void => {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    log('error', context ? `[${context}] ${msg}` : msg, { stack });
  },
};

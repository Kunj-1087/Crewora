/**
 * Structured Logger (Winston)
 *
 * Produces structured JSON logs with:
 * - ISO 8601 timestamps
 * - Service name and environment
 * - Request ID for tracing
 * - User ID (from JWT, if present)
 * - HTTP method, path, status code, duration
 * - Never logs: raw OTPs, full JWT tokens, full mobile numbers, PII
 *
 * Log format:
 *   { timestamp, level, service, environment, requestId, userId,
 *     method, path, statusCode, durationMs, message, error }
 */

import winston from 'winston';
import { isProduction, isDevelopment, isTest } from '../config/env';

const { combine, timestamp, json, errors, printf, colorize } = winston.format;

// ─── Custom format for structured JSON ───────────────────────────────────────

const structuredJsonFormat = combine(
  errors({ stack: true }),
  timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  json()
);

// ─── Development-friendly format ──────────────────────────────────────────────

const devFormat = combine(
  errors({ stack: true }),
  timestamp({ format: 'HH:mm:ss' }),
  colorize(),
  printf(({ timestamp, level, message, requestId, ...rest }) => {
    const extra = Object.keys(rest).length > 0
      ? ` ${JSON.stringify(rest, null, 0)}`
      : '';
    return `${timestamp} [${level}]${requestId ? ` [${requestId}]` : ''}: ${message}${extra}`;
  })
);

// ─── Logger Instance ──────────────────────────────────────────────────────────

export const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  format: isProduction ? structuredJsonFormat : devFormat,
  defaultMeta: {
    service: 'crewora-api',
    environment: isProduction ? 'production' : isDevelopment ? 'development' : 'test',
  },
  transports: [
    new winston.transports.Console({
      format: isProduction ? structuredJsonFormat : devFormat,
    }),
  ],
  // Suppress logs during tests
  silent: isTest,
});

// ─── Helper to suffix all log calls with request context ─────────────────────

/**
 * Creates a child logger pre-populated with request context.
 * Usage: const reqLogger = logger.child({ requestId, userId, method, path });
 */
export function createRequestLogger(reqContext: {
  requestId: string;
  userId?: string;
  method: string;
  path: string;
}): winston.Logger {
  return logger.child({
    requestId: reqContext.requestId,
    userId: reqContext.userId || 'anonymous',
    method: reqContext.method,
    path: reqContext.path,
  });
}

// ─── PII Masking Helpers ─────────────────────────────────────────────────────

/**
 * Mask a phone number for logging: +91 98XXXXX789
 */
export function maskPhone(phone: string | undefined | null): string {
  if (!phone) return 'none';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return '***';
  return `+91 ${digits.slice(0, 2)}XXXXX${digits.slice(-3)}`;
}

/**
 * Mask an email for logging: j***@example.com
 */
export function maskEmail(email: string | undefined | null): string {
  if (!email) return 'none';
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  return `${local[0]}***@${domain}`;
}

/**
 * Truncate a token for logging: eyJ...abc (first 5 chars + '...' + last 3 chars)
 */
export function maskToken(token: string | undefined | null): string {
  if (!token) return 'none';
  if (token.length <= 10) return '***';
  return `${token.slice(0, 5)}...${token.slice(-3)}`;
}

// ─── Structured Log Helper ───────────────────────────────────────────────────

export function logRequestComplete(
  reqLogger: winston.Logger,
  statusCode: number,
  durationMs: number,
  message?: string
): void {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  reqLogger.log(level, message || `${reqLogger.defaultMeta?.method} ${reqLogger.defaultMeta?.path}`, {
    statusCode,
    durationMs,
  });
}

export function logFailedOtp(
  reqLogger: winston.Logger,
  phone: string
): void {
  reqLogger.warn('Failed OTP verification attempt', {
    phone: maskPhone(phone),
  });
}

export function logJwtFailure(
  reqLogger: winston.Logger,
  ip: string
): void {
  reqLogger.warn('JWT verification failed', { ip });
}

export function logRateLimitHit(
  reqLogger: winston.Logger,
  ip: string,
  endpoint: string
): void {
  reqLogger.warn('Rate limit exceeded', { ip, endpoint });
}

export function logDbError(
  reqLogger: winston.Logger,
  queryHash: string,
  error: Error
): void {
  reqLogger.error('Database query error', {
    error: { message: error.message },
    queryHash,
  });
}

export function logAdminAction(
  reqLogger: winston.Logger,
  adminId: string,
  action: string,
  targetType: string,
  targetId?: string
): void {
  reqLogger.info('Admin action performed', {
    adminId,
    action,
    targetType,
    targetId,
  });
}

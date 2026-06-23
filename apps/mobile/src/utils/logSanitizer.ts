/**
 * Log Sanitizer
 *
 * Masks sensitive values before they reach the console or Sentry.
 * Applied automatically by the logger wrapper — callers don't need to think about it.
 *
 * Patterns:
 *   - Bearer tokens (Bearer + alphanumeric string > 20 chars)
 *   - 10-digit Indian mobile numbers
 *   - 6-digit numeric strings in OTP context
 *   - JWT-style base64url strings (two dot-separated segments + signature)
 */

// Regex patterns
const TOKEN_PATTERN = /Bearer\s+[A-Za-z0-9\-_]{20,}/gi;
const MOBILE_PATTERN = /\b[6-9]\d{9}\b/g;
const OTP_PATTERN = /\b\d{6}\b/g;
const JWT_PATTERN = /[A-Za-z0-9\-_]{20,}\.[A-Za-z0-9\-_]{20,}\.[A-Za-z0-9\-_]{20,}/g;

/**
 * Replace a mobile number with a masked version.
 * e.g. +91 9876543210 → +91 98XXXXX210
 */
function maskMobile(match: string): string {
  if (match.length >= 10) {
    return match.slice(0, 2) + 'XXXXX' + match.slice(-3);
  }
  return '[MOBILE]';
}

/**
 * Sanitize a single string value — replaces sensitive patterns with safe placeholders.
 */
export function sanitizeString(input: string): string {
  let result = input;

  // Must mask tokens first (before OTP) because JWT segments look like longer strings
  result = result.replace(JWT_PATTERN, '[JWT]');
  result = result.replace(TOKEN_PATTERN, 'Bearer [TOKEN]');

  // Mask mobile numbers
  result = result.replace(MOBILE_PATTERN, (m) => maskMobile(m));

  // Mask 6-digit OTP values (context-aware: only if near OTP-related words)
  // Simple heuristic: if "otp" or "code" appears within 50 chars of the number
  const otpContextPattern = /(?:otp|code|pin|verification|verify)[\s\S]{0,50}?\b(\d{6})\b/gi;
  result = result.replace(otpContextPattern, (match, p1: string) => {
    return match.replace(p1, '[OTP]');
  });

  return result;
}

/**
 * Recursively sanitize any value — walks objects and arrays, sanitizes strings.
 * Non-string primitives are passed through unchanged.
 */
export function sanitizeForLog<T>(value: T): T {
  if (typeof value === 'string') {
    return sanitizeString(value) as unknown as T;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeForLog) as unknown as T;
  }

  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      // Skip known sensitive keys entirely
      if (['token', 'accessToken', 'refreshToken', 'password', 'secret'].includes(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeForLog(val);
      }
    }
    return sanitized as unknown as T;
  }

  return value;
}

/**
 * Input Sanitization Utility
 *
 * Sanitizes user-generated content before DB write to prevent
 * HTML/JS injection attacks. Uses the `xss` npm package.
 *
 * Applied to: title, description, comment fields
 */

// @ts-ignore - xss package type mismatch with ESM/CJS interop
import xss from 'xss';

// ─── XSS Whitelist Configuration ──────────────────────────────────────────────
// Strip all HTML tags and attributes. Only allow safe content.

const xssOptions: any = {
  whiteList: {}, // No HTML tags allowed
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
  css: false, // No CSS allowed
};

// @ts-ignore - FilterXSS constructor type mismatch
const sanitizer = new (xss as any).FilterXSS(xssOptions);

/**
 * Sanitize a string — strip all HTML/JS, return plain text.
 * Returns empty string for non-string input.
 */
export function sanitize(input: unknown): string {
  if (typeof input !== 'string') return '';
  return sanitizer.process(input).trim();
}

/**
 * Sanitize an optional string field.
 * Returns undefined if input is undefined/null, sanitized string otherwise.
 */
export function sanitizeOptional(input: unknown): string | undefined {
  if (input === undefined || input === null) return undefined;
  return sanitize(input);
}

/**
 * Sanitize a title field (max 200 chars).
 */
export function sanitizeTitle(input: unknown): string {
  return sanitize(input).slice(0, 200);
}

/**
 * Sanitize a description field (max 2000 chars).
 */
export function sanitizeDescription(input: unknown): string {
  return sanitize(input).slice(0, 2000);
}

/**
 * Sanitize a comment field (max 1000 chars).
 */
export function sanitizeComment(input: unknown): string {
  return sanitize(input).slice(0, 1000);
}

/**
 * Deep sanitize an object — sanitizes all string fields recursively.
 * Useful for sanitizing entire request bodies before DB write.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitize(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Timing-safe token comparison to prevent timing attacks.
 * Uses crypto.timingSafeEqual() for all sensitive comparisons.
 */

import crypto from 'crypto';

export function timingSafeEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');

    if (bufA.length !== bufB.length) {
      // Still do a comparison to prevent timing leaks based on length
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }

    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

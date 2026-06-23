/**
 * OTP Verification Lockout Middleware
 *
 * After 5 failed attempts for a phone number, sets a 30-minute lockout.
 * Lockout state is stored in Redis (not in-memory) for multi-instance safety.
 * Falls back gracefully if Redis is unavailable.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { env } from '../config/env';

// ─── Redis Client (lazy-init) ────────────────────────────────────────────────

let redisClient: any = null;

function getRedis(): any {
  if (redisClient) return redisClient;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Redis = require('ioredis');
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // Don't retry — degrade gracefully
      lazyConnect: true,
    });
    return redisClient;
  } catch {
    return null;
  }
}

// ─── Keys ─────────────────────────────────────────────────────────────────────

const ATTEMPT_PREFIX = 'otp:attempts:';
const LOCKOUT_PREFIX = 'otp:lockout:';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;
const LOCKOUT_DURATION_MS = LOCKOUT_DURATION_MINUTES * 60 * 1000;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 min rolling window

// ─── Fallback in-memory store (when Redis is down) ───────────────────────────

const fallbackStore = new Map<string, { attempts: number[]; lockoutUntil: number | null }>();

// Cleanup fallback store periodically
setInterval(() => {
  const now = Date.now();
  for (const [phone, data] of fallbackStore) {
    // Remove entries with no recent attempts and no active lockout
    if (
      data.attempts.length === 0 &&
      (data.lockoutUntil === null || data.lockoutUntil < now)
    ) {
      fallbackStore.delete(phone);
    }
    // Clean up old attempts
    data.attempts = data.attempts.filter((t) => now - t < ATTEMPT_WINDOW_MS);
  }
}, 60_000);

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * Middleware factory for OTP verification lockout.
 * Checks lockout state before allowing OTP verification to proceed.
 * Call this BEFORE the OTP verification handler.
 */
export function checkOtpLockout() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const phone = req.body.phone as string | undefined;
      if (!phone) {
        next();
        return;
      }

      const normalizedPhone = phone.replace(/\D/g, '');
      const isLockedOut = await checkLockout(normalizedPhone);

      if (isLockedOut) {
        logger.warn('OTP verification blocked — phone in lockout', {
          phone: maskPhone(normalizedPhone),
          ip: req.ip,
        });

        res.status(429).json({
          success: false,
          error: {
            code: 'OTP_LOCKOUT',
            message: `Too many incorrect attempts. Please try again in ${LOCKOUT_DURATION_MINUTES} minutes.`,
          },
        });
        return;
      }

      next();
    } catch (error) {
      // If lockout check fails, allow the request through (fail open)
      logger.error('OTP lockout check failed — allowing request', { error });
      next();
    }
  };
}

/**
 * Records a failed OTP verification attempt.
 * Call this when OTP verification fails.
 */
export async function recordFailedOtpAttempt(phone: string): Promise<void> {
  const normalizedPhone = phone.replace(/\D/g, '');
  const redis = getRedis();

  if (redis) {
    try {
      const now = Date.now();
      const attemptKey = `${ATTEMPT_PREFIX}${normalizedPhone}`;
      const lockoutKey = `${LOCKOUT_PREFIX}${normalizedPhone}`;

      // Add current timestamp to sorted set
      await redis.zadd(attemptKey, now, `${now}`);
      // Remove attempts older than 15 minutes
      await redis.zremrangebyscore(attemptKey, 0, now - ATTEMPT_WINDOW_MS);
      // Set TTL on the key
      await redis.pexpire(attemptKey, ATTEMPT_WINDOW_MS);

      // Count recent attempts
      const attemptCount = await redis.zcard(attemptKey);

      if (attemptCount >= MAX_ATTEMPTS) {
        // Set lockout
        await redis.set(lockoutKey, '1', 'PX', LOCKOUT_DURATION_MS);
        logger.warn('OTP lockout activated', {
          phone: maskPhone(normalizedPhone),
          attempts: attemptCount,
          lockoutDurationMs: LOCKOUT_DURATION_MS,
        });
      }
    } catch {
      // Fall back to in-memory
      recordFallbackAttempt(normalizedPhone);
    }
  } else {
    recordFallbackAttempt(normalizedPhone);
  }
}

/**
 * Clears the lockout state on successful OTP verification.
 */
export async function clearOtpLockout(phone: string): Promise<void> {
  const normalizedPhone = phone.replace(/\D/g, '');
  const redis = getRedis();

  if (redis) {
    try {
      await redis.del(`${ATTEMPT_PREFIX}${normalizedPhone}`);
      await redis.del(`${LOCKOUT_PREFIX}${normalizedPhone}`);
    } catch {
      fallbackStore.delete(normalizedPhone);
    }
  } else {
    fallbackStore.delete(normalizedPhone);
  }
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

async function checkLockout(phone: string): Promise<boolean> {
  const redis = getRedis();

  if (redis) {
    try {
      const lockoutKey = `${LOCKOUT_PREFIX}${phone}`;
      const locked = await redis.get(lockoutKey);
      return locked === '1';
    } catch {
      return checkFallbackLockout(phone);
    }
  }

  return checkFallbackLockout(phone);
}

function recordFallbackAttempt(phone: string): void {
  const now = Date.now();
  let entry = fallbackStore.get(phone);

  if (!entry) {
    entry = { attempts: [], lockoutUntil: null };
    fallbackStore.set(phone, entry);
  }

  // Clean old attempts
  entry.attempts = entry.attempts.filter((t) => now - t < ATTEMPT_WINDOW_MS);
  entry.attempts.push(now);

  if (entry.attempts.length >= MAX_ATTEMPTS) {
    entry.lockoutUntil = now + LOCKOUT_DURATION_MS;
    logger.warn('OTP lockout activated (fallback store)', {
      phone: maskPhone(phone),
      attempts: entry.attempts.length,
    });
  }
}

function checkFallbackLockout(phone: string): boolean {
  const entry = fallbackStore.get(phone);
  if (!entry || entry.lockoutUntil === null) return false;
  if (Date.now() > entry.lockoutUntil) {
    entry.lockoutUntil = null;
    return false;
  }
  return true;
}

function maskPhone(phone: string): string {
  if (phone.length < 10) return '***';
  return `+91 ${phone.slice(0, 2)}XXXXX${phone.slice(-3)}`;
}

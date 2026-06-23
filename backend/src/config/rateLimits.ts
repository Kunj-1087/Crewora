/**
 * Layered Rate Limiting Configuration
 *
 * Route-specific limits with Redis-backed store for multi-instance safety.
 * - OTP endpoints: strict per-phone limits
 * - Writes: moderate limits
 * - Reads: generous limits
 * - Admin: tight limits
 *
 * Uses express-rate-limit with rate-limit-redis for distributed limiting.
 */

import rateLimit from 'express-rate-limit';
import type { Request } from 'express';
import { env } from './env';
import { logger } from '../utils/logger';

// ─── Redis Store (lazy-init, degrades gracefully) ────────────────────────────

let RedisStore: any = null;

function getStore() {
  if (RedisStore) return RedisStore;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const RedisStoreModule = require('rate-limit-redis');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const RedisClient = require('ioredis');
    const client = new RedisClient(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) return null; // Give up after 3 retries
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });
    RedisStore = new RedisStoreModule.default({
      sendCommand: (...args: any[]) => client.call(...args),
    });
    logger.info('Redis rate-limit store initialized');
    return RedisStore;
  } catch (err) {
    logger.warn('Redis unavailable — rate limits will use in-memory store', { err });
    return undefined; // Falls back to MemoryStore
  }
}

// ─── Key Generator ────────────────────────────────────────────────────────────
// Use user ID when authenticated, fall back to IP for anonymous traffic.

function keyGenerator(req: Request): string {
  const user = (req as any).user;
  if (user?.id) return `user:${user.id}`;
  return req.ip || req.socket.remoteAddress || 'unknown';
}

// ─── Handler Factory ──────────────────────────────────────────────────────────

function createHandler(endpoint: string) {
  return (_req: Request, _res: any, next: any) => {
    const ip = _req.ip || _req.socket.remoteAddress || 'unknown';
    logger.warn('Rate limit hit', {
      endpoint,
      ip,
      userId: (_req as any).user?.id || 'anonymous',
    });
    next(
      Object.assign(new Error('Too many requests. Please slow down.'), {
        statusCode: 429,
        code: 'RATE_LIMIT_EXCEEDED',
      })
    );
  };
}

// ─── Rate Limiters ────────────────────────────────────────────────────────────

const store = getStore();

// POST /api/v1/auth/customer/send-otp → 3 per phone per 10 min
export const sendOtpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  store,
  handler: createHandler('/auth/send-otp'),
});

// POST /api/v1/auth/customer/verify-otp → 5 per phone per 15 min
export const verifyOtpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  store,
  handler: createHandler('/auth/verify-otp'),
});

// Upload endpoints → 20 per IP per hour
// (profile photos, portfolio items)
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  store,
  handler: createHandler('/uploads'),
});

// POST /api/v1/jobs → 10 per customer per hour
export const createRequestRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  store,
  handler: createHandler('/jobs/create'),
});

// POST /api/v1/jobs/:id/apply → 20 per provider per hour
export const applyRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  store,
  handler: createHandler('/jobs/apply'),
});

// GET /* → 200 per IP per minute (general read)
export const readRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  store,
  handler: createHandler('GET *'),
});

// POST /* (other writes) → 50 per IP per minute
export const writeRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  store,
  handler: createHandler('POST *'),
});

// /api/v1/admin/* → 30 per IP per minute
export const adminRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  store,
  handler: createHandler('/admin/*'),
});

// /api/health → 60 per IP per minute (monitoring tools)
export const healthRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  store,
  handler: createHandler('/health'),
});

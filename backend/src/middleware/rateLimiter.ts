/**
 * Rate Limiting Middleware
 * Strict limits on auth endpoints, general limits on all others.
 */

import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/AppError';
import type { Request } from 'express';

/**
 * Build a key from user ID when available (authenticated routes),
 * falling back to IP for anonymous traffic.
 */
function keyGenerator(req: Request): string {
  const user = (req as any).user;
  if (user?.id) return `user:${user.id}`;
  return req.ip || req.socket.remoteAddress || 'unknown';
}

// Auth endpoints: max 10 requests per 1 minute per IP
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: (_req, _res, next) => {
    next(new AppError('Too many authentication attempts. Please try again in 1 minute.', 429));
  },
});

// General API: max 200 requests per 15 minutes (raised from 100 to accommodate REST polling)
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: (_req, _res, next) => {
    next(new AppError('Too many requests. Please slow down.', 429));
  },
});

// Upload endpoints: max 20 per hour (user-based keying since uploads require auth)
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: (_req, _res, next) => {
    next(new AppError('Upload limit reached. Please try again later.', 429));
  },
});

// Strict auth limiter for OTP send endpoints (most sensitive to abuse): 5 POST/min
export const strictAuthRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: (_req, _res, next) => {
    next(new AppError('Too many attempts. Please wait before trying again.', 429));
  },
});

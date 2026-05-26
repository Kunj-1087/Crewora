/**
 * Rate Limiting Middleware
 * Strict limits on auth endpoints, general limits on all others.
 */

import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/AppError';

// Auth endpoints: max 10 requests per 1 minute per IP
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new AppError('Too many authentication attempts. Please try again in 1 minute.', 429));
  },
});

// General API: max 100 requests per 15 minutes per IP
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new AppError('Too many requests. Please slow down.', 429));
  },
});

// Upload endpoints: max 20 per hour
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new AppError('Upload limit reached. Please try again later.', 429));
  },
});

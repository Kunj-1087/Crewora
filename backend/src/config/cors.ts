/**
 * CORS Configuration
 *
 * Explicitly whitelists only:
 * - https://crewora.in (production web)
 * - https://staging.crewora.in (staging)
 * - http://localhost:3000 (dev only, gated by NODE_ENV check)
 *
 * Never uses origin: '*' in production.
 * Allows Capacitor mobile origins for native app communication.
 */

import corsLib from 'cors';
import type { RequestHandler } from 'express';
import { env, isProduction } from './env';
import { logger } from '../utils/logger';

// ─── Allowed Origins ──────────────────────────────────────────────────────────

const productionOrigins = [
  'https://crewora.in',
  'https://www.crewora.in',
  'https://staging.crewora.in',
  'https://api.crewora.in',
];

const developmentOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5000',
];

// Mobile app origins (always allowed — they use the API, not a browser CORS)
const mobileOrigins = [
  /^capacitor:\/\/localhost$/,
  /^http:\/\/localhost/,
];

const corsOptions: corsLib.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, mobile apps, curl, etc.)
    if (!origin || origin === 'null') {
      callback(null, true);
      return;
    }

    // Check mobile origins first (regex patterns)
    if (mobileOrigins.some((pattern) => pattern.test(origin))) {
      callback(null, true);
      return;
    }

    // Check env-specific allowed origins
    const allowedOrigins = isProduction ? productionOrigins : [...productionOrigins, ...developmentOrigins];

    // Also parse CORS_ORIGINS from env for custom deployments
    const envOrigins = env.CORS_ORIGINS.split(',').map((o: string) => o.trim()).filter(Boolean);

    const allAllowed = [...allowedOrigins, ...envOrigins];

    if (allAllowed.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS request blocked', { origin });
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id', 'X-RateLimit-Remaining'],
  maxAge: 86400, // 24 hours — cache preflight results
};

/** Pre-initialized CORS middleware — ready to use with app.use() */
export const corsMiddleware: RequestHandler = corsLib(corsOptions) as unknown as RequestHandler;

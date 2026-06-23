/**
 * Express Application Setup
 *
 * Production-hardened middleware stack:
 * - Helmet with explicit CSP
 * - CORS with whitelist
 * - Request size limits (10kb)
 * - Request ID + logging
 * - Rate limiting (layered)
 * - Compression
 * - Timeout handling
 * - Graceful shutdown tracking
 * - All API routes mounted
 */

import express from 'express';
import path from 'path';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { corsMiddleware } from './config/cors';
import { errorHandler } from './middleware/errorHandler';
import { requestTimeout } from './middleware/timeout.middleware';
import { requestIdMiddleware, requestLoggingMiddleware } from './utils/requestId.middleware';
import { requestTracker } from './utils/gracefulShutdown';
import { logger } from './utils/logger';

// Rate limiters
import {
  readRateLimiter,
  writeRateLimiter,
  adminRateLimiter,
  healthRateLimiter,
} from './config/rateLimits';

// ─── Routes ──────────────────────────────────────────────────────────────────

import authRoutes from './modules/auth/auth.routes';
import customerRoutes from './modules/customers/customer.routes';
import workerRoutes from './modules/workers/worker.routes';
import jobRoutes from './modules/jobs/job.routes';
import adminRoutes from './modules/admin/admin.routes';
import inboxRoutes from './modules/inbox/inbox.routes';
import reviewRoutes from './modules/reviews/review.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import userRoutes from './modules/user/user.routes';
import adminAnalyticsRoutes from './modules/admin/adminAnalytics.routes';

const app = express();

// ─── Proxy Trust ──────────────────────────────────────────────────────────────
// Trust Render/Cloudflare/Nginx load balancer proxy for accurate IP

app.set('trust proxy', 1);

// ─── Security Headers (Helmet) ───────────────────────────────────────────────
// Explicit CSP — not just defaults

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://*.supabase.co', 'https://*.amazonaws.com'],
      connectSrc: ["'self'", 'https://sentry.io'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  hsts: {
    maxAge: 31536000,       // 1 year
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  hidePoweredBy: true,
}));

// ─── CORS (Explicit whitelist, never '*') ────────────────────────────────────

// @ts-ignore - Express @types/express and cors type mismatch
app.use(corsMiddleware);

// ─── Compression ──────────────────────────────────────────────────────────────

app.use(compression({
  level: 6,              // Default compression level
  threshold: 1024,       // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

// ─── Body Parsing (with 10kb limit) ──────────────────────────────────────────

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// NoSQL injection prevention is MongoDB-specific — removed for PostgreSQL

// ─── Request ID & Logging ────────────────────────────────────────────────────

app.use(requestIdMiddleware);

// ─── Global Timeout ───────────────────────────────────────────────────────────

app.use(requestTimeout);

// ─── Request Tracker (for graceful shutdown) ─────────────────────────────────

app.use(requestTracker);

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// General read limit on GET/*
app.use(/^\/(?!health|ready|uploads).*$/, (req, res, next) => {
  if (req.method === 'GET') {
    return readRateLimiter(req, res, next);
  }
  next();
});

// General write limit on POST/PUT/PATCH/DELETE/*
app.use(/^\/(?!health|ready|uploads).*$/, (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return writeRateLimiter(req, res, next);
  }
  next();
});

// ─── Static Files Serving ────────────────────────────────────────────────────

app.use('/uploads', (req, res, next) => {
  // Block directory listing
  if (req.path === '/' || req.path === '') {
    res.status(403).json({ success: false, message: 'Forbidden' });
    return;
  }
  // Only serve image files and APK files
  const isAllowed = /\.(jpg|jpeg|png|webp|apk)$/i.test(req.path);
  if (!isAllowed) {
    res.status(403).json({ success: false, message: 'Forbidden file type' });
    return;
  }
  next();
}, express.static(path.join(__dirname, '../uploads')));

// ─── Request Logging ─────────────────────────────────────────────────────────

app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`, {
    requestId: req.headers['x-request-id'],
  });
  next();
});

// ─── Health & Welcome Endpoints ───────────────────────────────────────────────
// Unauthenticated, rate-limited separately

import { getDBStatus } from './config/db';
import { isCacheAvailable } from './utils/cache';

app.get(['/', '/api', '/api/v1'], (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Crewora API',
    version: 'v1',
    timestamp: new Date().toISOString(),
  });
});

app.get(['/health', '/api/health', '/api/v1/health'], healthRateLimiter, (_req, res) => {
  const dbConnected = getDBStatus() === 1;
  res.status(200).json({
    status: 'ok',
    database: dbConnected ? 'connected' : 'degraded',
    redis: isCacheAvailable() ? 'connected' : 'degraded',
    uptime: Math.floor(process.uptime()),
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get(['/ready', '/api/ready', '/api/v1/ready'], (_req, res) => {
  const dbStatus = getDBStatus();
  if (dbStatus === 1) {
    res.status(200).json({ status: 'ready', db: 'connected', redis: isCacheAvailable() });
  } else {
    res.status(503).json({ status: 'not ready', db: 'disconnected' });
  }
});

// ─── Honeypot Endpoint ────────────────────────────────────────────────────────
// Catches API crawlers

import { honeypotHandler } from './middleware/botProtection.middleware';

app.get('/api/search-providers', honeypotHandler);

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/workers', workerRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/admin', adminRateLimiter, adminRoutes);
app.use('/api/v1/admin', adminRateLimiter, adminAnalyticsRoutes);
app.use('/api/v1/inbox', inboxRoutes);
app.use('/api/v1', reviewRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/user', userRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested route does not exist.',
    },
  });
});

// ─── Request Completion Logger ────────────────────────────────────────────────

app.use(requestLoggingMiddleware);

// ─── Global Error Handler ────────────────────────────────────────────────────

app.use(errorHandler);

export default app;

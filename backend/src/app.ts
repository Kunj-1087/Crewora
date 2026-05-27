/**
 * Express Application Setup
 * Middleware stack, route mounting, health endpoints.
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { apiRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { getDBStatus } from './config/db';
import { logger } from './utils/logger';

// Routes
import authRoutes from './modules/auth/auth.routes';
import customerRoutes from './modules/customers/customer.routes';
import workerRoutes from './modules/workers/worker.routes';
import jobRoutes from './modules/jobs/job.routes';
import adminRoutes from './modules/admin/admin.routes';
import inboxRoutes from './modules/inbox/inbox.routes';
import reviewRoutes from './modules/reviews/review.routes';

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
    
    // In development, dynamically allow localhost, loopback, local subnet IPs, and Capacitor webview origins
    const isLocalDev = env.NODE_ENV === 'development' && origin && (
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      origin.startsWith('http://192.168.') ||
      origin.startsWith('http://10.') ||
      origin.startsWith('capacitor://')
    );

    if (!origin || allowedOrigins.includes(origin) || isLocalDev) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body & Cookie Parsing ────────────────────────────────────────────────────

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ─── NoSQL Injection Prevention ───────────────────────────────────────────────

app.use(mongoSanitize());

// ─── Global Rate Limiting ─────────────────────────────────────────────────────

app.use('/api', apiRateLimiter);

// ─── Request Logging ──────────────────────────────────────────────────────────

app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// ─── Health & Welcome Endpoints ───────────────────────────────────────────────
// Must not require auth and must be excluded from strict rate limiting

const getHealthStatus = () => ({
  status: 'ok',
  message: 'Welcome to the Crewora API',
  version: 'v1',
  timestamp: new Date().toISOString(),
});

app.get(['/', '/api', '/api/v1'], (_req, res) => {
  res.status(200).json(getHealthStatus());
});

app.get(['/health', '/api/health', '/api/v1/health'], (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get(['/ready', '/api/ready', '/api/v1/ready'], (_req, res) => {
  const dbStatus = getDBStatus();
  if (dbStatus === 1) {
    res.status(200).json({ status: 'ready', db: 'connected' });
  } else {
    res.status(503).json({ status: 'not ready', db: 'disconnected' });
  }
});


// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/workers', workerRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/inbox', inboxRoutes);
app.use('/api/v1', reviewRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use(errorHandler);

export default app;

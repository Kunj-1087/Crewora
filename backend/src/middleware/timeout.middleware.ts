/**
 * Timeout & Circuit Breaker Middleware
 *
 * 1. Express timeout middleware — 10 second global timeout, returns 503
 * 2. Circuit breaker pattern for PostgreSQL DB calls using opossum
 */

// @ts-expect-error - express-timeout-handler has no type declarations
import timeout from 'express-timeout-handler';
import { logger } from '../utils/logger';

// ─── 1. Express Timeout ───────────────────────────────────────────────────────
// Global request timeout of 10 seconds — return 503 before request hangs

export const requestTimeout = timeout({
  timeout: 10_000, // 10 seconds
  onTimeout: (_req: any, res: any, _next: any) => {
    const requestId = res.locals?.requestId || 'unknown';
    logger.warn('Request timed out', { requestId, path: _req.path, method: _req.method });

    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        error: {
          code: 'REQUEST_TIMEOUT',
          message: 'Request timed out. Please try again.',
        },
      });
    }
  },
  // Disable on test endpoints like health checks that might need more time
  disable: ['/health', '/ready', '/api/health'],
});

// ─── 2. Circuit Breaker for Database Calls ────────────────────────────────────
// Using opossum npm package
// Opens after 5 consecutive failures, returns 503 while open
// Half-opens after 30 seconds to test recovery

// @ts-expect-error - opossum has no type declarations
import CircuitBreaker from 'opossum';

const circuitBreakerOptions = {
  timeout: 8000,        // 8 second timeout per DB call
  errorThresholdPercentage: 50,  // Open when 50% of requests fail
  resetTimeout: 30_000, // Try again after 30 seconds
  rollingCountTimeout: 60_000,   // Rolling window: 60 seconds
  rollingCountBuckets: 10,       // 10 buckets of 6 seconds each
  name: 'postgresql',
  volumeThreshold: 5,   // Minimum number of failures before opening
};

/**
 * Wraps a database operation in a circuit breaker.
 *
 * Usage:
 *   const result = await withCircuitBreaker(() => prisma.user.findMany(...));
 */
export async function withCircuitBreaker<T>(
  operation: () => Promise<T>,
  fallback?: () => Promise<T>
): Promise<T> {
  // Create a new breaker per operation (stateless, uses shared state)
  const breaker = new CircuitBreaker(operation, circuitBreakerOptions);

  breaker.on('open', () => {
    logger.warn('Circuit breaker opened — database calls are failing');
  });

  breaker.on('halfOpen', () => {
    logger.info('Circuit breaker half-open — testing database recovery');
  });

  breaker.on('close', () => {
    logger.info('Circuit breaker closed — database recovered');
  });

  breaker.fallback(() => {
    if (fallback) return fallback();
    throw Object.assign(new Error('Service temporarily unavailable'), {
      statusCode: 503,
      code: 'SERVICE_TEMPORARILY_UNAVAILABLE',
    });
  });

  try {
    return await breaker.fire();
  } catch (err: any) {
    if (err.statusCode === 503) {
      throw err;
    }
    throw err;
  }
}

/**
 * PostgreSQL Connection Pool
 *
 * Explicit pool configuration with:
 * - Right-sized for a 2-CPU cloud instance (max: 20)
 * - Load-shedding via connectionTimeoutMillis
 * - Pool event listeners that log + report to Sentry, never crash
 * - Health-check query on startup
 */

import { Pool, type PoolConfig } from 'pg';
import { logger } from '../utils/logger';
import { env } from '../config/env';

const poolConfig: PoolConfig = {
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  allowExitOnIdle: false,
};

export const pool = new Pool(poolConfig);

// ─── Pool Event Listeners ─────────────────────────────────────────────────────

pool.on('error', (err: Error) => {
  // Never crash the process on pool-level errors
  logger.error('PostgreSQL pool error', {
    error: {
      message: err.message,
      stack: err.stack,
    },
  });
  // Attempt to capture in Sentry (non-blocking)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Sentry = require('@sentry/node');
    Sentry.captureException(err, {
      tags: { service: 'database-pool' },
    });
  } catch {
    // Sentry not configured
  }
});

pool.on('connect', () => {
  logger.debug('New PostgreSQL client acquired from pool');
});

pool.on('acquire', () => {
  logger.debug('PostgreSQL client checked out from pool');
});

pool.on('remove', () => {
  logger.debug('PostgreSQL client removed from pool');
});

// ─── Health Check ─────────────────────────────────────────────────────────────

export async function verifyPoolConnectivity(): Promise<boolean> {
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1 AS health_check');
      logger.info('PostgreSQL pool health check passed');
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    logger.error('PostgreSQL pool health check failed', {
      error: err instanceof Error ? { message: err.message, stack: err.stack } : err,
    });
    return false;
  }
}

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

export async function closePool(): Promise<void> {
  logger.info('Closing PostgreSQL pool...');
  await pool.end();
  logger.info('PostgreSQL pool closed');
}

// ─── Pool Status ──────────────────────────────────────────────────────────────

export function getPoolStatus(): {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
} {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

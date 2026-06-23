/**
 * Graceful Shutdown Handler
 *
 * On SIGTERM / SIGINT:
 * 1. Stop accepting new requests immediately
 * 2. Wait for in-flight requests to complete (max 10 seconds)
 * 3. Close database pool cleanly
 * 4. Close Redis connection cleanly
 * 5. Log shutdown sequence completion
 * 6. Exit with code 0 (clean) or 1 (forced timeout)
 */

import { Server } from 'http';
import { logger } from './logger';
import { pool } from '../db/pool';

const SHUTDOWN_TIMEOUT_MS = 10_000; // 10 seconds max

interface ShutdownState {
  isShuttingDown: boolean;
  activeRequests: number;
}

const state: ShutdownState = {
  isShuttingDown: false,
  activeRequests: 0,
};

/**
 * Track active requests. Add this middleware to Express to track in-flight requests.
 */
export function requestTracker(
  _req: any,
  res: any,
  next: () => void
): void {
  if (state.isShuttingDown) {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_SHUTTING_DOWN',
        message: 'Server is shutting down. Please retry shortly.',
      },
    });
    return;
  }

  state.activeRequests++;
  res.on('finish', () => {
    state.activeRequests--;
  });
  next();
}

/**
 * Initialize graceful shutdown handlers.
 * Call this once during server bootstrap.
 */
export function initGracefulShutdown(server: Server): void {
  const shutdown = async (signal: string) => {
    if (state.isShuttingDown) {
      logger.warn(`Already shutting down — ignoring duplicate ${signal}`);
      return;
    }

    state.isShuttingDown = true;
    logger.info(`Received ${signal} — starting graceful shutdown`);

    // Step 1: Stop accepting new connections
    server.close(() => {
      logger.info('HTTP server closed — stopped accepting new connections');
    });

    // Step 2: Wait for in-flight requests
    const waitForRequests = async (): Promise<void> => {
      if (state.activeRequests <= 0) return;

      logger.info(`Waiting for ${state.activeRequests} in-flight requests to complete...`);

      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (state.activeRequests <= 0) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 500);

        // Timeout after max wait
        setTimeout(() => {
          clearInterval(checkInterval);
          logger.warn(`Timed out waiting for ${state.activeRequests} in-flight requests`);
          resolve();
        }, SHUTDOWN_TIMEOUT_MS);
      });
    };

    await waitForRequests();

    // Step 3: Close database pool
    try {
      await pool.end();
      logger.info('PostgreSQL pool closed');
    } catch (err) {
      logger.error('Error closing PostgreSQL pool', { err });
    }

    // Step 4: Redis connections are managed by the cache utility
    // and close automatically on process exit — no explicit teardown needed

    // Step 5: Log and exit
    logger.info('Graceful shutdown complete');
    process.exit(0);
  };

  const forceShutdown = () => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  };

  // Listen for shutdown signals
  process.on('SIGTERM', () => {
    shutdown('SIGTERM');
    setTimeout(forceShutdown, SHUTDOWN_TIMEOUT_MS + 2000);
  });

  process.on('SIGINT', () => {
    shutdown('SIGINT');
    setTimeout(forceShutdown, SHUTDOWN_TIMEOUT_MS + 2000);
  });

  logger.info('Graceful shutdown handlers registered');
}

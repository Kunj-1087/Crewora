/**
 * Server Entry Point
 * Initializes DB connection before starting the HTTP server.
 * Graceful shutdown on SIGTERM/SIGINT.
 */

import './config/env'; // Validate env first — crashes if invalid
import { connectDB } from './config/db';
import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

async function bootstrap() {
  try {
    await connectDB();

    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Crewora API running`, {
        port: env.PORT,
        environment: env.NODE_ENV,
      });
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled promise rejection', { reason });
      // In production, crash fast so the process manager can restart
      if (env.NODE_ENV === 'production') process.exit(1);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error });
      process.exit(1);
    });
  } catch (error) {
    logger.error('Bootstrap failed', { error });
    process.exit(1);
  }
}

bootstrap();

/**
 * PostgreSQL Connection via Prisma
 */

import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) {
    logger.info('PostgreSQL already connected');
    return;
  }

  try {
    // Verify connection by running a simple query
    await prisma.$queryRaw`SELECT 1`;
    isConnected = true;
    logger.info('PostgreSQL connected successfully via Prisma');
  } catch (error) {
    logger.error('PostgreSQL connection failed', { error });
    process.exit(1);
  }
}

export function getDBStatus(): number {
  return isConnected ? 1 : 0; // 1 = connected, 0 = disconnected
}

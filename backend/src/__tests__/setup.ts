/**
 * Test Environment Setup
 * Loads .env.test before all tests and provides database cleanup helpers.
 */

import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables before any imports that use them
dotenv.config({ path: path.join(__dirname, '../../.env.test') });

// Set NODE_ENV to test if not already set
process.env.NODE_ENV = 'test';

// ─── Database Cleanup ─────────────────────────────────────────────────────────
// These are safe to call in beforeEach/test teardown.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Truncate all tables in the correct order (respecting foreign key constraints).
 */
export async function cleanDatabase(): Promise<void> {
  await prisma.$transaction([
    prisma.review.deleteMany(),
    prisma.match.deleteMany(),
    prisma.message.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.deviceToken.deleteMany(),
    prisma.otp.deleteMany(),
    prisma.job.deleteMany(),
    prisma.portfolioItem.deleteMany(),
    prisma.worker.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.admin.deleteMany(),
  ]);
}

/**
 * Close the Prisma connection (call in afterAll).
 */
export async function closeDbConnection(): Promise<void> {
  await prisma.$disconnect();
}

export { prisma };

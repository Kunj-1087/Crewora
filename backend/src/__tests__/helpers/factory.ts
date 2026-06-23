/**
 * Test Data Factories
 * Build and create test records with sensible defaults.
 */

import { prisma } from '../setup';

export function buildCustomer(overrides: Record<string, any> = {}) {
  const id = overrides.id || `cust_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    name: 'Test Customer',
    phone: `98765${Math.random().toString().slice(2, 8)}`,
    isVerified: true,
    isActive: true,
    ...overrides,
  };
}

export function buildWorker(overrides: Record<string, any> = {}) {
  const id = overrides.id || `wrk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    name: 'Test Worker',
    phone: `87654${Math.random().toString().slice(2, 8)}`,
    tradeCategories: ['electrician'],
    city: 'Mumbai',
    availability: 'available',
    verificationStatus: 'approved' as const,
    isActive: true,
    ...overrides,
  };
}

export function buildAdmin(overrides: Record<string, any> = {}) {
  return {
    name: 'Test Admin',
    email: `admin_${Date.now()}@crewora.com`,
    passwordHash: '$2a$10$dummy_hash_for_testing',
    role: 'super_admin',
    isActive: true,
    ...overrides,
  };
}

export function buildJob(customerId: string, overrides: Record<string, any> = {}) {
  return {
    customerId,
    title: 'Fix a leaking pipe under the kitchen sink',
    description: 'The pipe under the kitchen sink has been leaking for two days. Need a plumber to inspect and fix it.',
    tradeCategory: 'plumber',
    address: 'Andheri West, Mumbai, Maharashtra',
    latitude: 19.1364,
    longitude: 72.8296,
    urgency: 'asap',
    status: 'open' as const,
    ...overrides,
  };
}

export function buildMatch(jobId: string, workerId: string, overrides: Record<string, any> = {}) {
  return {
    jobId,
    workerId,
    status: 'pending' as const,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    ...overrides,
  };
}

export function buildMessage(overrides: Record<string, any> = {}) {
  return {
    senderId: 'system',
    senderRole: 'system',
    receiverId: 'unknown',
    receiverRole: 'customer',
    content: 'Test message content.',
    ...overrides,
  };
}

/**
 * Creates a test customer in the database with a unique phone number.
 */
export async function createTestCustomer(overrides: Record<string, any> = {}): Promise<any> {
  const data = buildCustomer(overrides);
  return prisma.customer.create({ data });
}

/**
 * Creates a test worker in the database with a unique phone number.
 */
export async function createTestWorker(overrides: Record<string, any> = {}): Promise<any> {
  const data = buildWorker(overrides);
  return prisma.worker.create({ data });
}

/**
 * Creates a test admin in the database.
 */
export async function createTestAdmin(overrides: Record<string, any> = {}): Promise<any> {
  const data = buildAdmin(overrides);
  return prisma.admin.create({ data });
}

/**
 * Creates a test OTP record for the given phone and user type.
 */
export async function createTestOtp(phone: string, userType: 'customer' | 'worker', code = '654321'): Promise<void> {
  await prisma.otp.create({
    data: {
      phone,
      code,
      userType,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });
}

/**
 * Auth Service — Business Logic Layer
 *
 * Rewritten for production-hardening:
 * - OTPs are hashed with bcrypt (cost factor 12) before storing
 * - OTPs generated with crypto.randomInt(100000, 999999)
 * - Comparison uses bcrypt.compare()
 * - Immediately marks is_used = true on successful verification
 * - Rejects verification if expires_at < NOW() before hash comparison
 * - No more master OTP bypass in production
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { AppError } from '../../utils/AppError';
import { sendOtpSms } from '../../utils/sms';
import { matchOpenJobsForWorker } from '../jobs/job.service';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { recordFailedOtpAttempt, clearOtpLockout } from '../../middleware/otpLockout.middleware';

const BCRYPT_COST_FACTOR = 12;
const OTP_EXPIRY_MINUTES = 5;

// ─── Phone Normalization ─────────────────────────────────────────────────────

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

// ─── OT P Helpers ─────────────────────────────────────────────────────────────

/**
 * Generates a cryptographically secure 6-digit OTP.
 */
function generateSecureOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Hashes an OTP with bcrypt at cost factor 12.
 */
async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, BCRYPT_COST_FACTOR);
}

/**
 * Generates, hashes, and stores an OTP for the given phone number.
 * Deletes any existing live OTPs for this phone first.
 */
async function generateAndStoreOtp(
  phone: string,
  userType: 'customer' | 'worker'
): Promise<string> {
  const plainOtp = generateSecureOtp();
  const codeHash = await hashOtp(plainOtp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Clean up any existing live OTPs for this phone number
  await prisma.otp.deleteMany({
    where: {
      phone,
      expiresAt: { gt: new Date() },
      isUsed: false,
    },
  });

  // Create new OTP record with hashed code
  await prisma.otp.create({
    data: {
      phone,
      code: codeHash,
      userType,
      expiresAt,
      isUsed: false,
    },
  });

  // Send plain OTP via SMS (only time it's in plaintext)
  await sendOtpSms(phone, plainOtp);

  return plainOtp;
}

/**
 * Verifies and consumes an OTP.
 * - Rejects if expires_at < NOW() before hash comparison
 * - Rejects if already used (is_used = true)
 * - Compares with bcrypt.compare()
 * - Marks is_used = true on success
 * - Returns the OTP record ID
 */
async function verifyAndConsumeOtp(
  phone: string,
  code: string,
  userType: 'customer' | 'worker'
): Promise<void> {
  // ─── Master OTP for dev/test environments only ──────────────────
  if (code === '123456' && env.NODE_ENV !== 'production') {
    await prisma.otp.deleteMany({
      where: { phone, userType },
    });
    return;
  }

  // Find the most recent live OTP for this phone
  const otpRecord = await prisma.otp.findFirst({
    where: {
      phone,
      userType,
      expiresAt: { gt: new Date() },
      isUsed: false,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) {
    await recordFailedOtpAttempt(phone);
    throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
  }

  // Check expiry (double-check: the query already filters by expiresAt > NOW())
  if (otpRecord.expiresAt < new Date()) {
    await recordFailedOtpAttempt(phone);
    throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
  }

  // Check if already used (belt-and-suspenders: the query already filters isUsed = false)
  if (otpRecord.isUsed) {
    await recordFailedOtpAttempt(phone);
    throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
  }

  // Compare hash using bcrypt
  const isValid = await bcrypt.compare(code, otpRecord.code);

  if (!isValid) {
    await recordFailedOtpAttempt(phone);
    logger.warn('Failed OTP verification', {
      phone: normalizePhone(phone).slice(0, 2) + 'XXXXX' + normalizePhone(phone).slice(-3),
    });
    throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
  }

  // Mark as used (single-use enforcement)
  await prisma.otp.update({
    where: { id: otpRecord.id },
    data: { isUsed: true },
  });

  // Clear any lockout state on successful verification
  await clearOtpLockout(phone);
}

// ─── CUSTOMER AUTH ────────────────────────────────────────────────────────────

export async function sendOtpCustomer(phone: string): Promise<string> {
  return generateAndStoreOtp(normalizePhone(phone), 'customer');
}

export async function registerCustomer(data: {
  name: string;
  phone: string;
  otp: string;
}) {
  const normalizedPhone = normalizePhone(data.phone);

  // Verify OTP
  await verifyAndConsumeOtp(normalizedPhone, data.otp, 'customer');

  const existing = await prisma.customer.findUnique({
    where: { phone: normalizedPhone },
  });
  if (existing) {
    throw new AppError('Phone number already registered', 409, 'PHONE_EXISTS');
  }

  const customer = await prisma.customer.create({
    data: {
      name: data.name,
      phone: normalizedPhone,
    },
  });

  // Create system welcome message
  await prisma.message.create({
    data: {
      senderId: 'system',
      senderRole: 'system',
      receiverId: customer.id,
      receiverRole: 'customer',
      content: `Hi ${customer.name}! Welcome to Crewora. We're thrilled to have you here. Post your first job request now, and we will match you with verified, top-rated local workers in your area instantly!`,
    },
  });

  // Issue tokens immediately after registration
  const accessToken = signAccessToken(customer.id, 'customer');
  const refreshToken = signRefreshToken(customer.id, 'customer');

  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await prisma.customer.update({
    where: { id: customer.id },
    data: { refreshTokenHash },
  });

  return { customer, accessToken, refreshToken };
}

export async function loginCustomer(phone: string, otp: string) {
  const normalizedPhone = normalizePhone(phone);

  await verifyAndConsumeOtp(normalizedPhone, otp, 'customer');

  const customer = await prisma.customer.findUnique({
    where: { phone: normalizedPhone },
  });

  if (!customer || !customer.isActive) {
    throw new AppError('Account not found. Please register first.', 401, 'USER_NOT_FOUND');
  }

  const accessToken = signAccessToken(customer.id, 'customer');
  const refreshToken = signRefreshToken(customer.id, 'customer');

  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await prisma.customer.update({
    where: { id: customer.id },
    data: { refreshTokenHash },
  });

  return { customer, accessToken, refreshToken };
}

export async function refreshCustomerToken(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken, 'customer');
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }

  const customer = await prisma.customer.findUnique({
    where: { id: payload.sub },
  });

  if (!customer || !customer.refreshTokenHash || !customer.isActive) {
    throw new AppError('Session expired. Please log in again.', 401);
  }

  const isValid = await bcrypt.compare(refreshToken, customer.refreshTokenHash);
  if (!isValid) {
    // Token reuse detected — revoke all sessions
    await prisma.customer.update({
      where: { id: customer.id },
      data: { refreshTokenHash: null },
    });
    throw new AppError('Token reuse detected. Please log in again.', 401, 'TOKEN_REUSE');
  }

  // Rotate refresh token
  const newAccessToken = signAccessToken(customer.id, 'customer');
  const newRefreshToken = signRefreshToken(customer.id, 'customer');
  const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
  await prisma.customer.update({
    where: { id: customer.id },
    data: { refreshTokenHash: newRefreshTokenHash },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logoutCustomer(customerId: string) {
  await prisma.customer.update({
    where: { id: customerId },
    data: { refreshTokenHash: null },
  });
}

// ─── WORKER AUTH ──────────────────────────────────────────────────────────────

export async function sendOtpWorker(phone: string): Promise<string> {
  return generateAndStoreOtp(normalizePhone(phone), 'worker');
}

export async function registerWorker(data: {
  name: string;
  phone: string;
  otp: string;
  tradeCategories: string[];
  city: string;
}) {
  const normalizedPhone = normalizePhone(data.phone);

  await verifyAndConsumeOtp(normalizedPhone, data.otp, 'worker');

  const existing = await prisma.worker.findUnique({
    where: { phone: normalizedPhone },
  });
  if (existing) {
    throw new AppError('Phone number already registered', 409, 'PHONE_EXISTS');
  }

  const worker = await prisma.worker.create({
    data: {
      name: data.name,
      phone: normalizedPhone,
      tradeCategories: data.tradeCategories,
      city: data.city,
      verificationStatus: 'pending',
    },
  });

  // Create system welcome message
  await prisma.message.create({
    data: {
      senderId: 'system',
      senderRole: 'system',
      receiverId: worker.id,
      receiverRole: 'worker',
      content: `Hi ${worker.name}! Welcome to the Crewora Professional Network. Your profile is currently under review by our admin team (usually takes 24–48 hours). In the meantime, you can customize your profile details and set your availability status.`,
    },
  });

  const accessToken = signAccessToken(worker.id, 'worker');
  const refreshToken = signRefreshToken(worker.id, 'worker');
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await prisma.worker.update({
    where: { id: worker.id },
    data: { refreshTokenHash },
  });

  // Trigger matching for open jobs asynchronously
  matchOpenJobsForWorker(worker.id).catch((err) => {
    logger.error('Failed to match open jobs for worker on register', { error: err });
  });

  return { worker, accessToken, refreshToken };
}

export async function loginWorker(phone: string, otp: string) {
  const normalizedPhone = normalizePhone(phone);

  await verifyAndConsumeOtp(normalizedPhone, otp, 'worker');

  let worker = await prisma.worker.findUnique({
    where: { phone: normalizedPhone },
  });
  if (!worker) throw new AppError('Worker not found', 404);
  if (!worker.isActive) throw new AppError('Account is deactivated', 403);

  if (worker.verificationStatus === 'rejected') {
    throw new AppError(
      'Your profile verification was not approved. Please contact support for assistance.',
      403,
      'VERIFICATION_REJECTED'
    );
  }

  const accessToken = signAccessToken(worker.id, 'worker');
  const refreshToken = signRefreshToken(worker.id, 'worker');
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await prisma.worker.update({
    where: { id: worker.id },
    data: { refreshTokenHash },
  });

  return { worker, accessToken, refreshToken };
}

export async function refreshWorkerToken(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken, 'worker');
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }

  const worker = await prisma.worker.findUnique({
    where: { id: payload.sub },
  });

  if (!worker || !worker.refreshTokenHash || !worker.isActive) {
    throw new AppError('Session expired. Please log in again.', 401);
  }

  const isValid = await bcrypt.compare(refreshToken, worker.refreshTokenHash);
  if (!isValid) {
    await prisma.worker.update({
      where: { id: worker.id },
      data: { refreshTokenHash: null },
    });
    throw new AppError('Token reuse detected. Please log in again.', 401, 'TOKEN_REUSE');
  }

  const newAccessToken = signAccessToken(worker.id, 'worker');
  const newRefreshToken = signRefreshToken(worker.id, 'worker');
  const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
  await prisma.worker.update({
    where: { id: worker.id },
    data: { refreshTokenHash: newRefreshTokenHash },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logoutWorker(workerId: string) {
  await prisma.worker.update({
    where: { id: workerId },
    data: { refreshTokenHash: null },
  });
}

// ─── ADMIN AUTH ──────────────────────────────────────────────────────────────

function sanitizeAdmin<T extends { passwordHash?: string; refreshTokenHash?: string | null }>(admin: T) {
  const { passwordHash: _pw, refreshTokenHash: _rt, ...safe } = admin;
  return safe;
}

export async function loginAdmin(email: string, password: string) {
  const admin = await prisma.admin.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!admin || !admin.isActive) {
    throw new AppError('Invalid credentials', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  const accessToken = signAccessToken(admin.id, 'admin');
  const refreshToken = signRefreshToken(admin.id, 'admin');
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date(), refreshTokenHash },
  });

  return { admin: sanitizeAdmin(admin), accessToken, refreshToken };
}

export async function refreshAdminToken(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken, 'admin');
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }

  const admin = await prisma.admin.findUnique({
    where: { id: payload.sub },
  });

  if (!admin || !admin.refreshTokenHash || !admin.isActive) {
    throw new AppError('Session expired. Please log in again.', 401);
  }

  const isValid = await bcrypt.compare(refreshToken, admin.refreshTokenHash);
  if (!isValid) {
    await prisma.admin.update({
      where: { id: admin.id },
      data: { refreshTokenHash: null },
    });
    throw new AppError('Token reuse detected. Please log in again.', 401, 'TOKEN_REUSE');
  }

  const newAccessToken = signAccessToken(admin.id, 'admin');
  const newRefreshToken = signRefreshToken(admin.id, 'admin');
  const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
  await prisma.admin.update({
    where: { id: admin.id },
    data: { refreshTokenHash: newRefreshTokenHash },
  });

  return { admin: sanitizeAdmin(admin), accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logoutAdmin(adminId: string) {
  await prisma.admin.update({
    where: { id: adminId },
    data: { refreshTokenHash: null },
  });
}

export async function registerDeviceToken(userId: string, userType: string, token: string) {
  return await prisma.deviceToken.upsert({
    where: { token },
    update: { userId, userType },
    create: { userId, userType, token },
  });
}

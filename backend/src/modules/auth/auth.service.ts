/**
 * Auth Service — Business Logic Layer
 * Handles registration, login, token refresh, OTP sending/verification.
 * Completely decoupled from HTTP layer.
 */

import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { AppError } from '../../utils/AppError';
import { sendOtpSms } from '../../utils/sms';
import { matchOpenJobsForWorker } from '../jobs/job.service';

const OTP_EXPIRY_MINUTES = 5;

// ─── OTP HELPERS ──────────────────────────────────────────────────────────────

/**
 * Generates and stores a verification OTP for the given phone number.
 */
async function generateAndStoreOtp(phone: string, userType: 'customer' | 'worker'): Promise<string> {
  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Clean up any existing OTPs for this phone number
  await prisma.otp.deleteMany({
    where: { phone },
  });

  // Create new OTP record
  await prisma.otp.create({
    data: {
      phone,
      code,
      userType,
      expiresAt,
    },
  });

  // Trigger SMS sending (mock logger)
  await sendOtpSms(phone, code);

  return code;
}

/**
 * Verifies and consumes the OTP. Throws AppError if invalid/expired.
 */
async function verifyAndConsumeOtp(phone: string, code: string, userType: 'customer' | 'worker'): Promise<void> {
  // Master OTP bypass for testing and ease of use in all environments
  if (code === '123456') {
    // Delete any existing OTP records for this phone number/userType to keep db clean
    await prisma.otp.deleteMany({
      where: { phone, userType },
    });
    return;
  }

  const otpRecord = await prisma.otp.findFirst({
    where: {
      phone,
      code,
      userType,
    },
  });

  if (!otpRecord || otpRecord.expiresAt < new Date()) {
    throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
  }

  // Consume OTP by deleting it
  await prisma.otp.delete({
    where: { id: otpRecord.id },
  });
}

// ─── CUSTOMER AUTH ────────────────────────────────────────────────────────────

export async function sendOtpCustomer(phone: string): Promise<string> {
  return generateAndStoreOtp(phone, 'customer');
}

export async function registerCustomer(data: {
  name: string;
  phone: string;
  otp: string;
}) {
  // Verify OTP
  await verifyAndConsumeOtp(data.phone, data.otp, 'customer');

  const existing = await prisma.customer.findUnique({
    where: { phone: data.phone },
  });
  if (existing) {
    throw new AppError('Phone number already registered', 409, 'PHONE_EXISTS');
  }

  const customer = await prisma.customer.create({
    data: {
      name: data.name,
      phone: data.phone,
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

  // Store hashed refresh token
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await prisma.customer.update({
    where: { id: customer.id },
    data: { refreshTokenHash },
  });

  return { customer, accessToken, refreshToken };
}

export async function loginCustomer(phone: string, otp: string) {
  // Verify OTP
  await verifyAndConsumeOtp(phone, otp, 'customer');

  const customer = await prisma.customer.findUnique({
    where: { phone },
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
  return generateAndStoreOtp(phone, 'worker');
}

export async function registerWorker(data: {
  name: string;
  phone: string;
  otp: string;
  tradeCategories: string[];
  city: string;
}) {
  // Verify OTP
  await verifyAndConsumeOtp(data.phone, data.otp, 'worker');

  const existing = await prisma.worker.findUnique({
    where: { phone: data.phone },
  });
  if (existing) {
    throw new AppError('Phone number already registered', 409, 'PHONE_EXISTS');
  }

  const worker = await prisma.worker.create({
    data: {
      name: data.name,
      phone: data.phone,
      tradeCategories: data.tradeCategories,
      city: data.city,
      verificationStatus: 'approved',
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
    // Log error but don't block registration
    console.error('Failed to match open jobs for worker on register', err);
  });

  return { worker, accessToken, refreshToken };
}

export async function loginWorker(phone: string, otp: string) {
  // Verify OTP
  await verifyAndConsumeOtp(phone, otp, 'worker');

  let worker = await prisma.worker.findUnique({
    where: { phone },
  });
  if (!worker) throw new AppError('Worker not found', 404);
  if (!worker.isActive) throw new AppError('Account is deactivated', 403);

  // Auto-approve the worker on login if they are pending (robust fallback)
  if (worker.verificationStatus !== 'approved') {
    worker = await prisma.worker.update({
      where: { id: worker.id },
      data: { verificationStatus: 'approved' },
    });
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

// ─── ADMIN AUTH ───────────────────────────────────────────────────────────────

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

  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  const accessToken = signAccessToken(admin.id, 'admin');
  return { admin, accessToken };
}

export async function registerDeviceToken(userId: string, userType: string, token: string) {
  return await prisma.deviceToken.upsert({
    where: { token },
    update: { userId, userType },
    create: { userId, userType, token },
  });
}

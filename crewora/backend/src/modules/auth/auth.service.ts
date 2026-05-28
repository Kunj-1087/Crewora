/**
 * Auth Service — Business Logic Layer
 * Handles registration, login, token refresh, password reset.
 * Completely decoupled from HTTP layer.
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { AppError } from '../../utils/AppError';
import {
  comparePassword,
  isLocked,
  incrementLoginAttempts,
  resetLoginAttempts,
} from '../../utils/authHelpers';
import {
  sendEmail,
  welcomeCustomerEmail,
  welcomeWorkerEmail,
  passwordResetEmail,
} from '../../utils/email';
import { logger } from '../../utils/logger';

const BCRYPT_ROUNDS = 12;

// ─── CUSTOMER AUTH ────────────────────────────────────────────────────────────

export async function registerCustomer(data: {
  name: string;
  email: string;
  password: string;
  phone: string;
}) {
  const existing = await prisma.customer.findUnique({
    where: { email: data.email.trim().toLowerCase() },
  });
  if (existing) {
    throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  const customer = await prisma.customer.create({
    data: {
      name: data.name,
      email: data.email.trim().toLowerCase(),
      passwordHash,
      phone: data.phone,
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

  // Send welcome email (non-blocking)
  sendEmail({
    to: customer.email,
    subject: 'Welcome to Crewora!',
    html: welcomeCustomerEmail(customer.name),
  }).catch((err) => logger.error('Welcome email failed', { err }));

  return { customer, accessToken, refreshToken };
}

export async function loginCustomer(email: string, password: string) {
  const customer = await prisma.customer.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!customer || !customer.isActive) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  if (isLocked(customer.lockUntil)) {
    throw new AppError(
      'Account temporarily locked due to multiple failed attempts. Try again in 15 minutes.',
      423,
      'ACCOUNT_LOCKED'
    );
  }

  const isPasswordValid = await comparePassword(password, customer.passwordHash);

  if (!isPasswordValid) {
    await incrementLoginAttempts('customer', customer.id, customer.loginAttempts, customer.lockUntil);
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  await resetLoginAttempts('customer', customer.id);

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

export async function registerWorker(data: {
  name: string;
  email: string;
  password: string;
  phone: string;
  tradeCategories: string[];
  city: string;
}) {
  const existing = await prisma.worker.findUnique({
    where: { email: data.email.trim().toLowerCase() },
  });
  if (existing) {
    throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  const worker = await prisma.worker.create({
    data: {
      name: data.name,
      email: data.email.trim().toLowerCase(),
      passwordHash,
      phone: data.phone,
      tradeCategories: data.tradeCategories,
      city: data.city,
    },
  });

  const accessToken = signAccessToken(worker.id, 'worker');
  const refreshToken = signRefreshToken(worker.id, 'worker');
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await prisma.worker.update({
    where: { id: worker.id },
    data: { refreshTokenHash },
  });

  sendEmail({
    to: worker.email,
    subject: 'Welcome to Crewora — Profile Under Review',
    html: welcomeWorkerEmail(worker.name),
  }).catch((err) => logger.error('Worker welcome email failed', { err }));

  return { worker, accessToken, refreshToken };
}

export async function loginWorker(email: string, password: string) {
  const worker = await prisma.worker.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!worker || !worker.isActive) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  if (isLocked(worker.lockUntil)) {
    throw new AppError(
      'Account temporarily locked due to multiple failed attempts. Try again in 15 minutes.',
      423,
      'ACCOUNT_LOCKED'
    );
  }

  const isPasswordValid = await comparePassword(password, worker.passwordHash);

  if (!isPasswordValid) {
    await incrementLoginAttempts('worker', worker.id, worker.loginAttempts, worker.lockUntil);
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  await resetLoginAttempts('worker', worker.id);

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

  const isPasswordValid = await comparePassword(password, admin.passwordHash);
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

// ─── PASSWORD RESET ───────────────────────────────────────────────────────────

export async function forgotPasswordCustomer(email: string) {
  const customer = await prisma.customer.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  // Always return success to prevent email enumeration
  if (!customer) return;

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.customer.update({
    where: { id: customer.id },
    data: { passwordResetToken: resetTokenHash, passwordResetExpires: expiresAt },
  });

  sendEmail({
    to: customer.email,
    subject: 'Crewora — Password Reset Request',
    html: passwordResetEmail(customer.name, resetToken),
  }).catch((err) => logger.error('Reset email failed', { err }));
}

export async function resetPasswordCustomer(token: string, newPassword: string) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const customer = await prisma.customer.findFirst({
    where: {
      passwordResetToken: tokenHash,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!customer) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
      refreshTokenHash: null,
    },
  });
}

// ─── WORKER PASSWORD RESET ────────────────────────────────────────────────────

export async function forgotPasswordWorker(email: string) {
  const worker = await prisma.worker.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  // Always return success to prevent email enumeration
  if (!worker) return;

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.worker.update({
    where: { id: worker.id },
    data: { passwordResetToken: resetTokenHash, passwordResetExpires: expiresAt },
  });

  sendEmail({
    to: worker.email,
    subject: 'Crewora — Password Reset Request',
    html: passwordResetEmail(worker.name, resetToken),
  }).catch((err) => logger.error('Worker reset email failed', { err }));
}

export async function resetPasswordWorker(token: string, newPassword: string) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const worker = await prisma.worker.findFirst({
    where: {
      passwordResetToken: tokenHash,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!worker) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await prisma.worker.update({
    where: { id: worker.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
      refreshTokenHash: null,
    },
  });
}


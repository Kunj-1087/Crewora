/**
 * Auth Validation Schemas
 *
 * - sendOtp: Indian 10-digit mobile number
 * - verifyOtp: 6-digit numeric string
 * - register: includes profile fields
 * - login: phone + OTP
 */

import { z } from 'zod';

// ─── Phone Number ────────────────────────────────────────────────────────────

const phoneSchema = z
  .string()
  .transform((val) => val.replace(/\D/g, ''))
  .pipe(
    z
      .string()
      .length(10, 'Phone number must be exactly 10 digits')
      .regex(/^[6-9]\d{9}$/, 'Phone number must start with 6-9 and be 10 digits'),
  );

// ─── OTP ──────────────────────────────────────────────────────────────────────

const otpSchema = z
  .string()
  .regex(/^\d{6}$/, 'OTP must be a 6-digit numeric string');

// ─── Export ──────────────────────────────────────────────────────────────────

export const sendOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
});

export const customerRegisterSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim(),
  address: z.string().max(200).trim().optional(),
});

export const workerRegisterSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim(),
  tradeCategories: z
    .array(z.string())
    .min(1, 'At least one trade category is required')
    .max(10, 'Maximum 10 trade categories allowed'),
  city: z.string().min(1, 'City is required').max(100).trim(),
  bio: z.string().max(500).trim().optional(),
  experienceYears: z.number().int().min(0).max(70).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const loginSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
});

export const adminLoginSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(255)
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export const deviceTokenSchema = z.object({
  token: z.string().min(1, 'Device token is required').max(512),
});

/**
 * Shared phone validation: strips non-digits via transform, then validates 10-15 digits.
 * Accepts +91, spaces, dashes — all cleaned before validation.
 */
const phoneSchema = z
  .string()
  .transform((val) => val.replace(/\D/g, ''))
  .pipe(
    z.string().regex(/^\d{10,15}$/, 'Phone must be 10-15 digits (numbers only)')
  );

import { z } from 'zod';

export const sendOtpSchema = z.object({
  phone: phoneSchema,
});export const customerRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  phone: phoneSchema,
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});

export const workerRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  phone: phoneSchema,
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  tradeCategories: z
    .array(
      z.enum([
        'plumber', 'electrician', 'carpenter', 'painter',
        'welder', 'mason', 'hvac', 'tiler', 'roofer', 'other',
      ])
    )
    .min(1, 'At least one trade category is required'),
  city: z.string().min(2, 'City is required').trim(),
});

export const loginSchema = z.object({
  phone: phoneSchema,
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const deviceTokenSchema = z.object({
  token: z.string().min(10, 'Device token must be at least 10 characters'),
});

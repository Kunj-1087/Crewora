/**
 * Auth Zod Validation Schemas
 * Used by the validate middleware for runtime type safety.
 */

import { z } from 'zod';

export const sendOtpSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15),
});

export const customerRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});

export const workerRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  tradeCategories: z
    .array(
      z.enum([
        'plumber', 'electrician', 'carpenter', 'painter',
        'welder', 'mason', 'hvac', 'tiler', 'roofer', 'other',
      ])
    )
    .min(1, 'At least one trade category is required'),
  city: z.string().min(2, 'City is required'),
});

export const loginSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const deviceTokenSchema = z.object({
  token: z.string().min(10, 'Device token must be at least 10 characters'),
});

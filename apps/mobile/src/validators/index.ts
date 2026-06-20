/**
 * Mobile form validators.
 *
 * Auth + job schemas are re-exported from @crewora/shared so the client validates
 * with the exact same rules as the backend (no drift). UI-only schemas that the
 * shared package doesn't define (profile editing) live here.
 */

import { z } from 'zod';

export {
  sendOtpSchema,
  customerRegisterSchema,
  workerRegisterSchema,
  loginSchema,
  createJobSchema,
  updateJobSchema,
} from '@crewora/shared';

import type {
  sendOtpSchema as SendOtp,
  loginSchema as Login,
  customerRegisterSchema as CustomerRegister,
  workerRegisterSchema as WorkerRegister,
  createJobSchema as CreateJob,
} from '@crewora/shared';

export type SendOtpInput = z.infer<typeof SendOtp>;
export type LoginInput = z.infer<typeof Login>;
export type CustomerRegisterInput = z.infer<typeof CustomerRegister>;
export type WorkerRegisterInput = z.infer<typeof WorkerRegister>;
export type CreateJobInput = z.infer<typeof CreateJob>;

// ─── UI-only schemas ──────────────────────────────────────────────────────────

const phone = z
  .string()
  .regex(/^\d{10,15}$/, 'Enter a valid phone number');

export const customerProfileSchema = z.object({
  name: z.string().min(2, 'Name is too short').max(100),
  phone,
  address: z.string().max(200, 'Address is too long').optional().or(z.literal('')),
});
export type CustomerProfileInput = z.infer<typeof customerProfileSchema>;

export const workerProfileSchema = z.object({
  city: z.string().min(2, 'City is required'),
  experienceYears: z.coerce
    .number()
    .min(0, 'Cannot be negative')
    .max(60, 'That seems too high'),
  hourlyRate: z.coerce
    .number()
    .min(0, 'Cannot be negative')
    .max(100000, 'That seems too high'),
  bio: z.string().max(500, 'Keep your bio under 500 characters').optional().or(z.literal('')),
});
export type WorkerProfileInput = z.infer<typeof workerProfileSchema>;

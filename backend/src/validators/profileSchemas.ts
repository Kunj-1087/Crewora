/**
 * Profile Validation Schemas
 *
 * - updateCustomerProfile: name, phone, address
 * - updateWorkerProfile: skills array max 10, city, bio, availability, etc.
 */

import { z } from 'zod';

// ─── Shared ──────────────────────────────────────────────────────────────────

const phoneSchema = z
  .string()
  .transform((val) => val.replace(/\D/g, ''))
  .pipe(
    z
      .string()
      .length(10, 'Phone number must be exactly 10 digits')
      .regex(/^[6-9]\d{9}$/, 'Phone number must start with 6-9 and be 10 digits'),
  );

// ─── Customer Profile ────────────────────────────────────────────────────────

export const updateCustomerProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim()
    .optional(),
  phone: phoneSchema.optional(),
  address: z
    .string()
    .max(200, 'Address must not exceed 200 characters')
    .trim()
    .optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

// ─── Worker Profile ──────────────────────────────────────────────────────────

export const updateWorkerProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim()
    .optional(),
  phone: phoneSchema.optional(),
  tradeCategories: z
    .array(z.string())
    .min(1, 'At least one trade category is required')
    .max(10, 'Maximum 10 trade categories allowed')
    .optional(),
  bio: z
    .string()
    .max(500, 'Bio must not exceed 500 characters')
    .trim()
    .optional(),
  experienceYears: z.number().int().min(0).max(70).optional(),
  city: z.string().min(1).max(100).trim().optional(),
  serviceRadius: z.number().int().min(1).max(200).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  availability: z.enum(['available', 'unavailable', 'on_a_job']).optional(),
  hourlyRate: z.number().int().min(0).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' },
);

export const availabilitySchema = z.object({
  availability: z.enum(['available', 'unavailable', 'on_a_job'], {
    errorMap: () => ({ message: 'Availability must be "available", "unavailable", or "on_a_job"' }),
  }),
});

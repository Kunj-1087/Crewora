/**
 * Request (Job) Validation Schemas
 *
 * - createRequest: title, description, category enum, lat/lng range validation
 * - updateRequest: partial update with valid status transitions
 */

import { z } from 'zod';

// ─── Shared Enums ────────────────────────────────────────────────────────────

const tradeCategories = [
  'plumbing',
  'electrical',
  'carpentry',
  'painting',
  'cleaning',
  'appliance_repair',
  'hvac',
  'gardening',
  'moving',
  'renovation',
  'roofing',
  'flooring',
  'pest_control',
  'handyman',
  'other',
] as const;

const jobStatuses = [
  'draft',
  'open',
  'matched',
  'in_progress',
  'completed',
  'cancelled',
] as const;

// Status transitions are validated at runtime in the service layer
// with the current status fetched from the database

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const createRequestSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must not exceed 200 characters')
    .trim(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must not exceed 2000 characters')
    .trim(),
  tradeCategory: z.enum(tradeCategories, {
    errorMap: () => ({ message: 'Invalid trade category' }),
  }),
  address: z
    .string()
    .min(1, 'Address is required')
    .max(500)
    .trim(),
  latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  urgency: z.enum(['asap', 'scheduled'], {
    errorMap: () => ({ message: 'Urgency must be "asap" or "scheduled"' }),
  }),
  scheduledAt: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  city: z
    .string()
    .max(100)
    .trim()
    .optional(),
});

export const updateRequestSchema = z.object({
  title: z.string().min(5).max(200).trim().optional(),
  description: z.string().min(10).max(2000).trim().optional(),
  tradeCategory: z.enum(tradeCategories).optional(),
  address: z.string().max(500).trim().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  urgency: z.enum(['asap', 'scheduled']).optional(),
  scheduledAt: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' },
);

export const requestIdSchema = z.object({
  id: z.string().uuid('Request ID must be a valid UUID'),
});

export const requestQuerySchema = z.object({
  status: z.enum(jobStatuses).optional(),
  tradeCategory: z.enum(tradeCategories).optional(),
  page: z
    .string()
    .optional()
    .transform((v) => parseInt(v || '1', 10))
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .optional()
    .transform((v) => parseInt(v || '20', 10))
    .pipe(z.number().int().min(1).max(100)),
  cursor: z.string().optional(),
  cursorId: z.string().uuid().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['open', 'matched', 'in_progress', 'completed', 'cancelled'], {
    errorMap: () => ({ message: 'Invalid status' }),
  }),
});
// Status transition is validated at runtime in the service layer
// with the current status fetched from the database

/**
 * Review Validation Schemas
 *
 * - createReview: rating 1-5 integer, comment max 1000 chars
 * - getWorkerReviews: pagination query params
 */

import { z } from 'zod';

export const createReviewSchema = z.object({
  rating: z
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  comment: z
    .string()
    .max(1000, 'Comment must not exceed 1000 characters')
    .trim()
    .optional(),
});

export const reviewQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => parseInt(v || '1', 10))
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .optional()
    .transform((v) => parseInt(v || '10', 10))
    .pipe(z.number().int().min(1).max(100)),
});

export const jobIdParamSchema = z.object({
  jobId: z.string().uuid('Job ID must be a valid UUID'),
});

export const workerIdParamSchema = z.object({
  workerId: z.string().uuid('Worker ID must be a valid UUID'),
});

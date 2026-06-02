import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(150),
  description: z.string().min(20, 'Please provide a detailed description').max(2000),
  tradeCategory: z.enum([
    'plumber', 'electrician', 'carpenter', 'painter',
    'welder', 'mason', 'hvac', 'tiler', 'roofer', 'other',
  ]),
  location: z.object({
    address: z.string().min(5, 'Location address is required'),
    coordinates: z.tuple([
      z.number().min(-180).max(180), // longitude
      z.number().min(-90).max(90),   // latitude
    ]),
  }),
  urgency: z.enum(['asap', 'scheduled']),
  scheduledAt: z.string().datetime().optional(),
});

export const updateJobSchema = z.object({
  title: z.string().min(5).max(150).optional(),
  description: z.string().min(20).max(2000).optional(),
  scheduledAt: z.string().datetime().optional(),
  status: z.enum(['cancelled']).optional(), // customers can only cancel
  cancellationReason: z.string().max(500).optional(),
});

export const jobIdSchema = z.object({
  id: z.string().uuid('Invalid job ID'),
});

export const jobQuerySchema = z.object({
  page: z.string().default('1').transform(Number),
  limit: z.string().default('10').transform(Number),
  status: z.string().optional(),
});

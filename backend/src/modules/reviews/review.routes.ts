import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { validate } from '../../middleware/validate';
import * as reviewController from './review.controller';
import { z } from 'zod';

const router = Router();

router.post(
  '/jobs/:jobId/review',
  requireAuth('customer'),
  validate({
    params: z.object({ jobId: z.string().uuid() }),
    body: z.object({
      rating: z.number().int().min(1).max(5),
      comment: z.string().max(500).optional(),
    }),
  }),
  reviewController.createReview
);

router.get(
  '/workers/:workerId/reviews',
  validate({
    params: z.object({ workerId: z.string().uuid() }),
    query: z.object({
      page: z.string().regex(/^\d+$/).transform(Number).optional(),
      limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    }),
  }),
  reviewController.getWorkerReviews
);

export default router;

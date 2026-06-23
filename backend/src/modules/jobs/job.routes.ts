import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createJobSchema, updateJobSchema, jobIdSchema, jobQuerySchema } from './job.schemas';
import * as jobController from './job.controller';
import { z } from 'zod';

const router = Router();

// Customer routes
router.post(
  '/',
  authenticate('customer'),
  validate({ body: createJobSchema }),
  jobController.createJob
);

router.get(
  '/',
  authenticate('customer'),
  validate({ query: jobQuerySchema }),
  jobController.getMyJobs
);

router.get(
  '/:id',
  authenticate('customer', 'worker'),
  validate({ params: jobIdSchema }),
  jobController.getJobById
);

router.patch(
  '/:id',
  authenticate('customer'),
  validate({ params: jobIdSchema, body: updateJobSchema }),
  jobController.updateJob
);

router.get(
  '/:id/matches',
  authenticate('customer'),
  validate({ params: jobIdSchema }),
  jobController.getJobMatches
);

// Worker routes
router.get(
  '/worker/feed',
  authenticate('worker'),
  validate({ query: jobQuerySchema }),
  jobController.getWorkerJobFeed
);

router.post(
  '/worker/matches/:matchId/respond',
  authenticate('worker'),
  validate({
    params: z.object({ matchId: z.string().uuid() }),
    body: z.object({ action: z.enum(['accept', 'decline']) }),
  }),
  jobController.respondToMatch
);

router.post(
  '/:id/complete',
  authenticate('customer', 'worker'),
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
      rating: z.number().int().min(1).max(5),
      comment: z.string().max(500).optional(),
    }),
  }),
  jobController.completeJob
);

export default router;

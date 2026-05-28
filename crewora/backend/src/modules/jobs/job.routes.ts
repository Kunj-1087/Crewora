import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { validate } from '../../middleware/validate';
import { createJobSchema, updateJobSchema, jobIdSchema, jobQuerySchema } from './job.schemas';
import * as jobController from './job.controller';
import { z } from 'zod';

const router = Router();

// Customer routes
router.post(
  '/',
  requireAuth('customer'),
  validate({ body: createJobSchema }),
  jobController.createJob
);

router.get(
  '/',
  requireAuth('customer'),
  validate({ query: jobQuerySchema }),
  jobController.getMyJobs
);

router.get(
  '/:id',
  requireAuth('customer', 'worker'),
  validate({ params: jobIdSchema }),
  jobController.getJobById
);

router.patch(
  '/:id',
  requireAuth('customer'),
  validate({ params: jobIdSchema, body: updateJobSchema }),
  jobController.updateJob
);

router.get(
  '/:id/matches',
  requireAuth('customer'),
  validate({ params: jobIdSchema }),
  jobController.getJobMatches
);

// Worker routes
router.get(
  '/worker/feed',
  requireAuth('worker'),
  validate({ query: jobQuerySchema }),
  jobController.getWorkerJobFeed
);

router.post(
  '/worker/matches/:matchId/respond',
  requireAuth('worker'),
  validate({
    params: z.object({ matchId: z.string().uuid() }),
    body: z.object({ action: z.enum(['accept', 'decline']) }),
  }),
  jobController.respondToMatch
);

export default router;

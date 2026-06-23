import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { z } from 'zod';
import * as adminService from './admin.service';

const router = Router();

// All admin routes require admin auth
router.use(authenticate('admin'));
router.use(requireAdmin);

const pageQuery = z.object({
  page: z.string().default('1').transform(Number),
  limit: z.string().default('20').transform(Number),
  status: z.string().optional(),
});

const uuidParamSchema = z.object({
  id: z.string().uuid('ID must be a valid UUID'),
});

// Dashboard stats
router.get('/stats', async (_req, res, next) => {
  try {
    const stats = await adminService.getPlatformStats();
    res.json({ success: true, data: { stats } });
  } catch (error) { next(error); }
});

// Verification queue
router.get('/verification-queue', validate({ query: pageQuery }), async (req, res, next) => {
  try {
    const { page, limit } = req.query as any;
    const result = await adminService.getVerificationQueue(page, limit);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

// Approve worker
router.post(
  '/workers/:id/approve',
  validate({ params: uuidParamSchema }),
  async (req, res, next) => {
    try {
      const worker = await adminService.approveWorker(req.params.id);
      res.json({ success: true, message: 'Worker approved', data: { worker } });
    } catch (error) { next(error); }
  }
);

// Reject worker
router.post(
  '/workers/:id/reject',
  validate({
    params: uuidParamSchema,
    body: z.object({ reason: z.string().min(10, 'Please provide a detailed reason') }),
  }),
  async (req, res, next) => {
    try {
      const worker = await adminService.rejectWorker(req.params.id, req.body.reason);
      res.json({ success: true, message: 'Worker rejected', data: { worker } });
    } catch (error) { next(error); }
  }
);

// List workers
router.get('/workers', validate({ query: pageQuery }), async (req, res, next) => {
  try {
    const { page, limit, status } = req.query as any;
    const result = await adminService.getAllWorkers(page, limit, status);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

// List customers
router.get('/customers', validate({ query: pageQuery }), async (req, res, next) => {
  try {
    const { page, limit } = req.query as any;
    const result = await adminService.getAllCustomers(page, limit);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

// List jobs
router.get('/jobs', validate({ query: pageQuery }), async (req, res, next) => {
  try {
    const { page, limit, status } = req.query as any;
    const result = await adminService.getAllJobs(page, limit, status);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

// Deactivate user (UUID-validated for both userType and id)
router.patch(
  '/:userType/:id/deactivate',
  validate({
    params: z.object({
      userType: z.enum(['customer', 'worker']),
      id: z.string().uuid('ID must be a valid UUID'),
    }),
  }),
  async (req, res, next) => {
    try {
      const user = await adminService.deactivateUser(
        req.params.id,
        req.params.userType as 'customer' | 'worker'
      );
      res.json({ success: true, message: 'User deactivated', data: { user } });
    } catch (error) { next(error); }
  }
);

export default router;


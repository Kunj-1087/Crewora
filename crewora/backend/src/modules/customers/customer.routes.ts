import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';

const router = Router();

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().min(10).max(15).optional(),
  address: z.string().max(200).optional(),
});

// Get own profile
router.get('/me', requireAuth('customer'), async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.user!.id },
    });
    if (!customer) throw new AppError('Customer not found', 404);
    res.json({ success: true, data: { customer } });
  } catch (error) { next(error); }
});

// Update own profile
router.patch(
  '/me',
  requireAuth('customer'),
  validate({ body: updateProfileSchema }),
  async (req, res, next) => {
    try {
      const customer = await prisma.customer.update({
        where: { id: req.user!.id },
        data: req.body,
      });
      if (!customer) throw new AppError('Customer not found', 404);
      res.json({ success: true, message: 'Profile updated', data: { customer } });
    } catch (error) { next(error); }
  }
);

// Delete account (soft delete)
router.delete(
  '/me',
  requireAuth('customer'),
  validate({ body: z.object({ confirmation: z.literal('DELETE MY ACCOUNT') }) }),
  async (req, res, next) => {
    try {
      await prisma.customer.update({
        where: { id: req.user!.id },
        data: {
          isActive: false,
          email: `deleted_${Date.now()}_${req.user!.id}@deleted.crewora`,
        },
      });
      res.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) { next(error); }
  }
);

export default router;

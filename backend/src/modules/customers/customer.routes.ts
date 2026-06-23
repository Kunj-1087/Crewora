import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';

const router = Router();

/**
 * Phone validation: strips non-digits via transform, then validates 10-15 digits.
 */
const phoneSchema = z
  .string()
  .transform((val) => val.replace(/\D/g, ''))
  .pipe(
    z.string().regex(/^\d{10,15}$/, 'Phone must be 10-15 digits (numbers only)')
  );

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  phone: phoneSchema.optional(),
  address: z.string().max(200).trim().optional(),
});

// Get own profile
router.get('/me', authenticate('customer'), async (req, res, next) => {
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
  authenticate('customer'),
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
  authenticate('customer'),
  validate({ body: z.object({ confirmation: z.literal('DELETE MY ACCOUNT') }) }),
  async (req, res, next) => {
    try {
      await prisma.customer.update({
        where: { id: req.user!.id },
        data: {
          isActive: false,
          phone: `deleted_${Date.now()}_${req.user!.id}`,
        },
      });
      res.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) { next(error); }
  }
);

export default router;

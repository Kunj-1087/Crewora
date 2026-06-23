import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { translateBackend, getLanguageFromRequest } from '../../utils/lang';

const router = Router();

const languageSchema = z.object({
  language: z.enum(['en', 'gu'], {
    errorMap: () => ({ message: 'Language must be either en or gu' }),
  }),
});

// GET /user/language
router.get('/language', authenticate('customer', 'worker'), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const userType = req.user!.type;

    let language: string | null = null;

    if (userType === 'customer') {
      const customer = await prisma.customer.findUnique({
        where: { id: userId },
        select: { languagePreference: true },
      });
      if (!customer) throw new AppError('Customer not found', 404);
      language = customer.languagePreference;
    } else if (userType === 'worker') {
      const worker = await prisma.worker.findUnique({
        where: { id: userId },
        select: { languagePreference: true },
      });
      if (!worker) throw new AppError('Worker not found', 404);
      language = worker.languagePreference;
    }

    res.json({
      success: true,
      language,
      data: {
        language,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /user/language
router.post(
  '/language',
  authenticate('customer', 'worker'),
  validate({ body: languageSchema }),
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const userType = req.user!.type;
      const { language } = req.body;

      if (userType === 'customer') {
        const customer = await prisma.customer.update({
          where: { id: userId },
          data: { languagePreference: language },
        });
        if (!customer) throw new AppError('Customer not found', 404);
      } else if (userType === 'worker') {
        const worker = await prisma.worker.update({
          where: { id: userId },
          data: { languagePreference: language },
        });
        if (!worker) throw new AppError('Worker not found', 404);
      }

      const reqLang = getLanguageFromRequest(req);
      const successMessage = translateBackend('success.profile_updated', reqLang);

      res.json({
        success: true,
        message: successMessage,
        language,
        data: {
          language,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

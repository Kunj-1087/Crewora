/**
 * Auth Routes
 * Fully rate-limited and validated.
 */

import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authRateLimiter } from '../../middleware/rateLimiter';
import { requireAuth } from '../../middleware/requireAuth';
import * as authController from './auth.controller';
import {
  customerRegisterSchema,
  workerRegisterSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  adminLoginSchema,
} from './auth.schemas';

const router = Router();

// ─── Customer Auth ────────────────────────────────────────────────────────────
router.post(
  '/customer/register',
  authRateLimiter,
  validate({ body: customerRegisterSchema }),
  authController.registerCustomer
);

router.post(
  '/customer/login',
  authRateLimiter,
  validate({ body: loginSchema }),
  authController.loginCustomer
);

router.post('/customer/refresh', authRateLimiter, authController.refreshCustomerToken);

router.post(
  '/customer/logout',
  requireAuth('customer'),
  authController.logoutCustomer
);

router.post(
  '/customer/forgot-password',
  authRateLimiter,
  validate({ body: forgotPasswordSchema }),
  authController.forgotPasswordCustomer
);

router.post(
  '/customer/reset-password',
  authRateLimiter,
  validate({ body: resetPasswordSchema }),
  authController.resetPasswordCustomer
);

// ─── Worker Auth ──────────────────────────────────────────────────────────────
router.post(
  '/worker/register',
  authRateLimiter,
  validate({ body: workerRegisterSchema }),
  authController.registerWorker
);

router.post(
  '/worker/login',
  authRateLimiter,
  validate({ body: loginSchema }),
  authController.loginWorker
);

router.post('/worker/refresh', authRateLimiter, authController.refreshWorkerToken);

router.post('/worker/logout', requireAuth('worker'), authController.logoutWorker);

router.post(
  '/worker/forgot-password',
  authRateLimiter,
  validate({ body: forgotPasswordSchema }),
  authController.forgotPasswordWorker
);

router.post(
  '/worker/reset-password',
  authRateLimiter,
  validate({ body: resetPasswordSchema }),
  authController.resetPasswordWorker
);

// ─── Admin Auth ───────────────────────────────────────────────────────────────
router.post(
  '/admin/login',
  authRateLimiter,
  validate({ body: adminLoginSchema }),
  authController.loginAdmin
);

export default router;


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
  sendOtpSchema,
  customerRegisterSchema,
  workerRegisterSchema,
  loginSchema,
  adminLoginSchema,
  deviceTokenSchema,
} from './auth.schemas';

const router = Router();

// ─── Customer Auth ────────────────────────────────────────────────────────────
router.post(
  '/customer/send-otp',
  authRateLimiter,
  validate({ body: sendOtpSchema }),
  authController.sendOtpCustomer
);

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

// ─── Worker Auth ──────────────────────────────────────────────────────────────
router.post(
  '/worker/send-otp',
  authRateLimiter,
  validate({ body: sendOtpSchema }),
  authController.sendOtpWorker
);

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

// ─── Admin Auth ───────────────────────────────────────────────────────────────
router.post(
  '/admin/login',
  authRateLimiter,
  validate({ body: adminLoginSchema }),
  authController.loginAdmin
);

router.post(
  '/device-token',
  requireAuth('customer', 'worker'),
  validate({ body: deviceTokenSchema }),
  authController.registerDeviceToken
);

export default router;

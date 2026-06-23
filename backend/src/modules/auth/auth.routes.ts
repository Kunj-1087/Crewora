/**
 * Auth Routes
 * Fully rate-limited and validated.
 */

import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { sendOtpRateLimiter, verifyOtpRateLimiter, writeRateLimiter as authWriteRateLimiter } from '../../config/rateLimits';
import { authenticate } from '../../middleware/auth.middleware';
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
  sendOtpRateLimiter,
  validate({ body: sendOtpSchema }),
  authController.sendOtpCustomer
);router.post(
  '/customer/register',
  authWriteRateLimiter,
  validate({ body: customerRegisterSchema }),
  authController.registerCustomer
);

router.post(
  '/customer/login',
  verifyOtpRateLimiter,
  validate({ body: loginSchema }),
  authController.loginCustomer
);

router.post('/customer/refresh', authWriteRateLimiter, authController.refreshCustomerToken);

router.post(
  '/customer/logout',
  authenticate('customer'),
  authController.logoutCustomer
);

// ─── Worker Auth ──────────────────────────────────────────────────────────────
router.post(
  '/worker/send-otp',
  sendOtpRateLimiter,
  validate({ body: sendOtpSchema }),
  authController.sendOtpWorker
);

router.post(
  '/worker/register',
  authWriteRateLimiter,
  validate({ body: workerRegisterSchema }),
  authController.registerWorker
);

router.post(
  '/worker/login',
  verifyOtpRateLimiter,
  validate({ body: loginSchema }),
  authController.loginWorker
);

router.post('/worker/refresh', authWriteRateLimiter, authController.refreshWorkerToken);

router.post('/worker/logout', authenticate('worker'), authController.logoutWorker);

// ─── Admin Auth ───────────────────────────────────────────────────────────────
router.post(
  '/admin/login',
  authWriteRateLimiter,
  validate({ body: adminLoginSchema }),
  authController.loginAdmin
);

router.post('/admin/refresh', authWriteRateLimiter, authController.refreshAdminToken);

router.post('/admin/logout', authenticate('admin'), authController.logoutAdmin);

router.post(
  '/device-token',
  authenticate('customer', 'worker'),
  validate({ body: deviceTokenSchema }),
  authController.registerDeviceToken
);

export default router;

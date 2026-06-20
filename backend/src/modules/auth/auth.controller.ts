/**
 * Auth Controller — HTTP Layer
 * Thin controller: delegates to auth service, sets cookies, formats responses.
 */

import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { env } from '../../config/env';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

// ─── CUSTOMER ─────────────────────────────────────────────────────────────────

export async function sendOtpCustomer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { phone } = req.body;
    const otp = await authService.sendOtpCustomer(phone);
    const data: Record<string, any> = { otp };
    res.json({
      success: true,
      message: 'Verification OTP sent successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function registerCustomer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { customer, accessToken, refreshToken } = await authService.registerCustomer(req.body);
    res.cookie('crewora_customer_refresh', refreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user: customer, accessToken },
    });
  } catch (error) {
    next(error);
  }
}

export async function loginCustomer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { phone, otp } = req.body;
    const { customer, accessToken, refreshToken } = await authService.loginCustomer(phone, otp);
    res.cookie('crewora_customer_refresh', refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({
      success: true,
      message: 'Login successful',
      data: { user: customer, accessToken },
    });
  } catch (error) {
    next(error);
  }
}

export async function refreshCustomerToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const refreshToken = req.cookies?.crewora_customer_refresh;
    if (!refreshToken) {
      res.status(401).json({ success: false, message: 'No refresh token' });
      return;
    }
    const { accessToken, refreshToken: newRefreshToken } =
      await authService.refreshCustomerToken(refreshToken);
    res.cookie('crewora_customer_refresh', newRefreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({ success: true, data: { accessToken } });
  } catch (error) {
    next(error);
  }
}

export async function logoutCustomer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (req.user?.id) await authService.logoutCustomer(req.user.id);
    res.clearCookie('crewora_customer_refresh', { path: '/' });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}

// ─── WORKER ───────────────────────────────────────────────────────────────────

export async function sendOtpWorker(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { phone } = req.body;
    const otp = await authService.sendOtpWorker(phone);
    const data: Record<string, any> = { otp };
    res.json({
      success: true,
      message: 'Verification OTP sent successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function registerWorker(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { worker, accessToken, refreshToken } = await authService.registerWorker(req.body);
    res.cookie('crewora_worker_refresh', refreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(201).json({
      success: true,
      message: 'Registration successful. Your profile is under review.',
      data: { user: worker, accessToken },
    });
  } catch (error) {
    next(error);
  }
}

export async function loginWorker(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { phone, otp } = req.body;
    const { worker, accessToken, refreshToken } = await authService.loginWorker(phone, otp);
    res.cookie('crewora_worker_refresh', refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({
      success: true,
      message: 'Login successful',
      data: { user: worker, accessToken },
    });
  } catch (error) {
    next(error);
  }
}

export async function refreshWorkerToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const refreshToken = req.cookies?.crewora_worker_refresh;
    if (!refreshToken) {
      res.status(401).json({ success: false, message: 'No refresh token' });
      return;
    }
    const { accessToken, refreshToken: newRefreshToken } =
      await authService.refreshWorkerToken(refreshToken);
    res.cookie('crewora_worker_refresh', newRefreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({ success: true, data: { accessToken } });
  } catch (error) {
    next(error);
  }
}

export async function logoutWorker(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (req.user?.id) await authService.logoutWorker(req.user.id);
    res.clearCookie('crewora_worker_refresh', { path: '/' });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────

export async function loginAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;
    const { admin, accessToken, refreshToken } = await authService.loginAdmin(email, password);
    res.cookie('crewora_admin_refresh', refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({
      success: true,
      message: 'Admin login successful',
      data: { user: admin, accessToken },
    });
  } catch (error) {
    next(error);
  }
}

export async function refreshAdminToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const refreshToken = req.cookies?.crewora_admin_refresh;
    if (!refreshToken) {
      res.status(401).json({ success: false, message: 'No refresh token' });
      return;
    }
    const { admin, accessToken, refreshToken: newRefreshToken } =
      await authService.refreshAdminToken(refreshToken);
    res.cookie('crewora_admin_refresh', newRefreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({ success: true, data: { user: admin, accessToken } });
  } catch (error) {
    next(error);
  }
}

export async function logoutAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (req.user?.id) await authService.logoutAdmin(req.user.id);
    res.clearCookie('crewora_admin_refresh', { path: '/' });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}

export async function registerDeviceToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.body;
    await authService.registerDeviceToken(req.user!.id, req.user!.type, token);
    res.json({ success: true, message: 'Device token registered successfully' });
  } catch (error) {
    next(error);
  }
}

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
    const { email, password } = req.body;
    const { customer, accessToken, refreshToken } = await authService.loginCustomer(email, password);
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

export async function forgotPasswordCustomer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await authService.forgotPasswordCustomer(req.body.email);
    // Always return success (prevent email enumeration)
    res.json({
      success: true,
      message: 'If that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPasswordCustomer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token, password } = req.body;
    await authService.resetPasswordCustomer(token, password);
    res.json({ success: true, message: 'Password reset successful. Please log in again.' });
  } catch (error) {
    next(error);
  }
}

// ─── WORKER ───────────────────────────────────────────────────────────────────

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
    const { email, password } = req.body;
    const { worker, accessToken, refreshToken } = await authService.loginWorker(email, password);
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
    const { admin, accessToken } = await authService.loginAdmin(email, password);
    res.json({
      success: true,
      message: 'Admin login successful',
      data: { user: admin, accessToken },
    });
  } catch (error) {
    next(error);
  }
}

// ─── WORKER PASSWORD RESET ────────────────────────────────────────────────────

export async function forgotPasswordWorker(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await authService.forgotPasswordWorker(req.body.email);
    // Always return success (prevent email enumeration)
    res.json({
      success: true,
      message: 'If that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPasswordWorker(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token, password } = req.body;
    await authService.resetPasswordWorker(token, password);
    res.json({ success: true, message: 'Password reset successful. Please log in again.' });
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


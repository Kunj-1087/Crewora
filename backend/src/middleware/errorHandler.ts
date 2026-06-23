/**
 * Global Error Handler Middleware
 * Catches all errors, formats them consistently, never leaks stack traces in production.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';
import { translateBackend, getLanguageFromRequest } from '../utils/lang';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error (sanitized)
  logger.error('Request error', {
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  const lang = getLanguageFromRequest(req);

  // Operational errors: known, safe to expose message
  if (err instanceof AppError) {
    const errorMsgMap: Record<string, string> = {
      'Authentication required': 'errors.auth_required',
      'Invalid or expired token': 'errors.invalid_token',
      'Customer not found': 'errors.customer_not_found',
      'Worker not found': 'errors.worker_not_found',
      'Job not found': 'errors.job_not_found',
      'Match not found': 'errors.match_not_found',
      'This match has already been responded to': 'errors.already_responded',
      'You cannot accept a new job until your current active job is completed.': 'errors.active_job_exists',
      'Rating must be between 1 and 5': 'errors.invalid_rating',
      'Not authorized to complete this job': 'errors.unauthorized_job_complete',
      'Cannot complete a cancelled job': 'errors.cannot_complete_cancelled',
      'No worker was assigned to this job': 'errors.no_worker_assigned',
      'You have already submitted feedback for this job': 'errors.double_review',
      'Invalid or expired OTP': 'errors.invalid_otp',
      'Phone number already registered': 'errors.phone_exists',
      'Account not found. Please register first.': 'errors.user_not_found',
      'Session expired. Please log in again.': 'errors.session_expired',
      'Invalid refresh token': 'errors.invalid_refresh_token',
      'No photo file uploaded': 'errors.no_photo_uploaded',
      'Only images (jpg, jpeg, png, webp) are allowed!': 'errors.invalid_image_type',
    };

    const translationKey = errorMsgMap[err.message] || err.message;
    const translatedMessage = translateBackend(translationKey, lang);

    res.status(err.statusCode).json({
      success: false,
      message: translatedMessage,
      ...(err.code && { code: err.code }),
    });
    return;
  }

  // ── Prisma database errors ──
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2000': {
        const column = (err.meta?.column_name as string) || 'column';
        res.status(400).json({ success: false, message: `Value too long for ${column}.` });
        return;
      }
      case 'P2002': {
        const target = (err.meta?.target as string[])?.join(', ') || 'field';
        const msg = lang === 'gu'
          ? `આ ${target} સાથેનો રેકોર્ડ પહેલેથી જ અસ્તિત્વમાં છે.`
          : `A record with this ${target} already exists.`;
        res.status(409).json({ success: false, message: msg });
        return;
      }
      case 'P2003': {
        const msg = lang === 'gu'
          ? 'અમાન્ય લિંક કરેલ રેકોર્ડ (ફોરેન કી મર્યાદા નિષ્ફળ).'
          : 'Invalid referenced record (foreign key constraint failed).';
        res.status(400).json({ success: false, message: msg });
        return;
      }
      case 'P2014': {
        const msg = lang === 'gu'
          ? 'આવશ્યક સંબંધનું ઉલ્લંઘન થયું છે.'
          : 'Required relation violation.';
        res.status(400).json({ success: false, message: msg });
        return;
      }
      case 'P2024': {
        const msg = lang === 'gu'
          ? 'ડેટાબેઝ કનેક્શન પૂલનો સમય સમાપ્ત થયો. ફરી પ્રયાસ કરો.'
          : 'Database connection pool timeout. Please retry.';
        res.status(503).json({ success: false, message: msg });
        return;
      }
      case 'P2025': {
        const msg = lang === 'gu'
          ? 'રેકોર્ડ મળ્યો નથી.'
          : 'Record not found.';
        res.status(404).json({ success: false, message: msg });
        return;
      }
      default:
        res.status(400).json({
          success: false,
          message: lang === 'gu'
            ? `ડેટાબેઝ ભૂલ: ${err.message}`
            : `Database error: ${err.message}`,
        });
        return;
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: lang === 'gu' ? 'અમાન્ય ટોકન' : 'Invalid token'
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: lang === 'gu' ? 'ટોકન સમાપ્ત થઈ ગયું છે' : 'Token expired'
    });
    return;
  }

  // Unknown/programmer errors — never expose details in production
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? (lang === 'gu' ? 'કોઈ અણધારી ભૂલ આવી છે' : 'An unexpected error occurred')
      : err.message,
  });
}

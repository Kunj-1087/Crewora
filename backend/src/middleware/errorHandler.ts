/**
 * Global Error Handler Middleware
 * Catches all errors, formats them consistently, never leaks stack traces in production.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';

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

  // Operational errors: known, safe to expose message
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.code && { code: err.code }),
    });
    return;
  }

  // Prisma database errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const target = (err.meta?.target as string[])?.join(', ') || 'field';
        res.status(409).json({
          success: false,
          message: `A record with this ${target} already exists.`,
        });
        return;
      }
      case 'P2003': {
        res.status(400).json({
          success: false,
          message: 'Invalid referenced record (foreign key constraint failed).',
        });
        return;
      }
      case 'P2025': {
        res.status(404).json({
          success: false,
          message: 'Record not found.',
        });
        return;
      }
      default:
        res.status(400).json({
          success: false,
          message: `Database error: ${err.message}`,
        });
        return;
    }
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.message,
    });
    return;
  }

  // Mongoose duplicate key error
  if ((err as NodeJS.ErrnoException).code === '11000') {
    res.status(409).json({
      success: false,
      message: 'A record with this value already exists',
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ success: false, message: 'Invalid token' });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, message: 'Token expired' });
    return;
  }

  // Unknown/programmer errors — never expose details in production
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
  });
}

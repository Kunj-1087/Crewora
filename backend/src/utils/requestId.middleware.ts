/**
 * Request ID Middleware
 *
 * Generates a UUID per request and attaches it to:
 * - res.locals.requestId (for logger access)
 * - Response header x-request-id (for client tracing)
 * - req.headers['x-request-id'] (for downstream middleware)
 *
 * All logs within the request lifecycle include this ID for tracing.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

declare global {
  namespace Express {
    interface Locals {
      requestId: string;
      startTime: number;
      userId?: string;
      userRole?: string;
    }
  }
}

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Use existing request ID from header if present (e.g., from CDN/load balancer)
  const existingId = req.headers['x-request-id'];
  const requestId = typeof existingId === 'string' && existingId.length > 0
    ? existingId
    : crypto.randomUUID();

  // Attach to request for downstream access
  req.headers['x-request-id'] = requestId;

  // Attach to response locals for logger access
  res.locals.requestId = requestId;
  res.locals.startTime = Date.now();

  // Set response header
  res.setHeader('x-request-id', requestId);

  next();
}

/**
 * Middleware that logs the completion of each request with duration.
 * Place this AFTER all routes.
 */
export function requestLoggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Capture the original end to log after response is sent
  const originalEnd = res.end;

  res.end = function (this: Response, ...args: any[]) {
    const duration = Date.now() - (res.locals.startTime || Date.now());
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    const logData: Record<string, any> = {
      requestId: res.locals.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
    };

    if (res.locals.userId) {
      logData.userId = res.locals.userId;
    }

    // Use console.log as a simple structured logger for request completion
    // This complements the Winston logger for request tracing
    const message = `${req.method} ${req.path} ${res.statusCode} ${duration}ms`;

    if (level === 'error') {
      console.error(JSON.stringify({ level, message, ...logData, timestamp: new Date().toISOString() }));
    } else if (level === 'warn') {
      console.warn(JSON.stringify({ level, message, ...logData, timestamp: new Date().toISOString() }));
    } else {
      console.log(JSON.stringify({ level, message, ...logData, timestamp: new Date().toISOString() }));
    }

    return originalEnd.apply(this, args as any);
  } as any;

  next();
}

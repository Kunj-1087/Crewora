/**
 * Authentication Middleware
 *
 * Verifies JWT signature with jsonwebtoken.verify() (never decode-only).
 * Rejects expired tokens with 401 (not silent pass-through).
 * Extracts user_id + role and attaches to req.user.
 * Never trusts req.body.role or req.query.userId for authorization —
 * only the verified JWT payload.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type TokenUserType } from '../utils/jwt';
import { logger } from '../utils/logger';

// ─── Type Augmentation ────────────────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        type: TokenUserType;
      };
    }
  }
}

// ─── Authenticate Middleware ──────────────────────────────────────────────────

/**
 * Middleware factory that authenticates a request by verifying the JWT access
 * token against one or more allowed user types.
 *
 * Usage: router.get('/profile', authenticate('customer', 'worker'), handler)
 */
export function authenticate(...allowedTypes: TokenUserType[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required. Please provide a valid Bearer token.',
          },
        });
        return;
      }

      const token = authHeader.split(' ')[1];

      if (!token) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required. Token is missing.',
          },
        });
        return;
      }

      // Try to verify against each allowed type
      let decoded = null;
      let matchedType: TokenUserType | null = null;

      for (const type of allowedTypes) {
        try {
          decoded = verifyAccessToken(token, type);
          matchedType = type;
          break;
        } catch {
          // Try next type
        }
      }

      if (!decoded || !matchedType) {
        logger.warn('JWT verification failed', {
          ip: req.ip,
          path: req.path,
          method: req.method,
        });

        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_OR_EXPIRED_TOKEN',
            message: 'Invalid or expired token. Please log in again.',
          },
        });
        return;
      }

      // Attach decoded user to request — NEVER from req.body or req.query
      req.user = {
        id: decoded.sub,
        type: matchedType,
      };

      next();
    } catch (error) {
      logger.error('Auth middleware error', {
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        ip: req.ip,
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An authentication error occurred.',
        },
      });
    }
  };
}

// ─── Role Guards ──────────────────────────────────────────────────────────────

/**
 * Restrict access to specific roles. Must be used AFTER authenticate().
 *
 * Usage: router.get('/admin-only', authenticate('admin'), requireRole('admin'), handler)
 */
export function requireRole(...roles: TokenUserType[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required.',
        },
      });
      return;
    }

    if (!roles.includes(req.user.type)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Required role: ${roles.join(' or ')}.`,
        },
      });
      return;
    }

    next();
  };
}

// Convenience guards
export const requireCustomer = requireRole('customer');
export const requireWorker = requireRole('worker');
export const requireAdmin = requireRole('admin');
export const requireCustomerOrWorker = requireRole('customer', 'worker');

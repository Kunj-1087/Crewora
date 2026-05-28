/**
 * Authentication Middleware
 * Verifies JWT access token from Authorization header.
 * Attaches decoded user to req.user for downstream use.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenUserType } from '../utils/jwt';
import { AppError } from '../utils/AppError';

export function requireAuth(...allowedTypes: TokenUserType[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader?.startsWith('Bearer ')) {
        throw new AppError('Authentication required', 401);
      }

      const token = authHeader.split(' ')[1];

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
        throw new AppError('Invalid or expired token', 401);
      }

      req.user = { id: decoded.sub, type: matchedType };
      next();
    } catch (error) {
      next(error);
    }
  };
}

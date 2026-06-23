/**
 * JWT Utilities
 * Separate secrets for Customer, Worker, and Admin tokens.
 * Access tokens: 15 min | Refresh tokens: 7 days
 */

import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export type TokenUserType = 'customer' | 'worker' | 'admin';

export interface TokenPayload {
  sub: string;        // user id
  type: TokenUserType;
  iat?: number;
  exp?: number;
}

function getSecrets(userType: TokenUserType): {
  accessSecret: string;
  refreshSecret: string;
} {
  switch (userType) {
    case 'customer':
      return {
        accessSecret: env.JWT_CUSTOMER_ACCESS_SECRET,
        refreshSecret: env.JWT_CUSTOMER_REFRESH_SECRET,
      };
    case 'worker':
      return {
        accessSecret: env.JWT_WORKER_ACCESS_SECRET,
        refreshSecret: env.JWT_WORKER_REFRESH_SECRET,
      };
    case 'admin':
      return {
        accessSecret: env.JWT_ADMIN_ACCESS_SECRET,
        refreshSecret: env.JWT_ADMIN_REFRESH_SECRET,
      };
  }
}

export function signAccessToken(userId: string, userType: TokenUserType): string {
  const { accessSecret } = getSecrets(userType);
  const payload: TokenPayload = { sub: userId, type: userType };
  const options: SignOptions = { expiresIn: '15m' };
  return jwt.sign(payload, accessSecret, options);
}

export function signRefreshToken(userId: string, userType: TokenUserType): string {
  const { refreshSecret } = getSecrets(userType);
  const payload: TokenPayload = { sub: userId, type: userType };
  const options: SignOptions = { expiresIn: '7d' };
  return jwt.sign(payload, refreshSecret, options);
}

export function verifyAccessToken(token: string, userType: TokenUserType): TokenPayload {
  const { accessSecret } = getSecrets(userType);
  return jwt.verify(token, accessSecret) as TokenPayload;
}

export function verifyRefreshToken(token: string, userType: TokenUserType): TokenPayload {
  const { refreshSecret } = getSecrets(userType);
  return jwt.verify(token, refreshSecret) as TokenPayload;
}

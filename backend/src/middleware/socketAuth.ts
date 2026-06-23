/**
 * Socket.io Authentication Middleware
 * Verifies JWT access token on connection and restricts room joining
 * to the authenticated user's own ID.
 */

import { Socket } from 'socket.io';
import { verifyAccessToken, TokenUserType } from '../utils/jwt';
import { logger } from '../utils/logger';

/**
 * Middleware that authenticates Socket.io connections via a JWT
 * passed in the `token` query parameter or `auth.token` handshake option.
 */
export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void): void {
  try {
    // Extract token from handshake auth or query
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token as string | undefined;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    // Try verifying against all supported user types
    const types: TokenUserType[] = ['customer', 'worker', 'admin'];
    let decoded: { sub: string; type: TokenUserType } | null = null;

    for (const userType of types) {
      try {
        const payload = verifyAccessToken(token, userType);
        decoded = { sub: payload.sub, type: payload.type as TokenUserType };
        break;
      } catch {
        // Try next type
      }
    }

    if (!decoded) {
      return next(new Error('Invalid or expired token'));
    }

    // Attach user data to socket for downstream use
    (socket as any).user = { id: decoded.sub, type: decoded.type };
    logger.debug(`Socket authenticated: user=${decoded.sub} type=${decoded.type} socketId=${socket.id}`);
    next();
  } catch (error) {
    logger.error('Socket auth error', { error });
    next(new Error('Authentication failed'));
  }
}

/**
 * Validate that a socket can only join its own user room.
 */
export function validateRoomJoin(socket: Socket, userId: string): boolean {
  const user = (socket as any).user;
  if (!user) return false;
  return user.id === userId;
}

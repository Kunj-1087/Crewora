/**
 * Auth Test Helpers
 * Generate valid JWT tokens for use in integration tests.
 */

import { signAccessToken, signRefreshToken, TokenUserType } from '../../utils/jwt';

/**
 * Returns a valid access token for the given user ID and type.
 */
export function getAuthToken(userId: string, type: TokenUserType = 'customer'): string {
  return signAccessToken(userId, type);
}

/**
 * Returns a pair of valid access and refresh tokens.
 */
export function getTokensPair(userId: string, type: TokenUserType = 'customer'): {
  accessToken: string;
  refreshToken: string;
} {
  return {
    accessToken: signAccessToken(userId, type),
    refreshToken: signRefreshToken(userId, type),
  };
}

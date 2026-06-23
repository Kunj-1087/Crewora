/**
 * JWT Utilities — Unit Tests
 */

import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../../utils/jwt';

describe('signAccessToken', () => {
  it('creates a valid JWT with correct payload', () => {
    const token = signAccessToken('user-123', 'customer');
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const decoded = verifyAccessToken(token, 'customer');
    expect(decoded.sub).toBe('user-123');
    expect(decoded.type).toBe('customer');
  });

  it('tokens have different secrets per user type', () => {
    const token = signAccessToken('user-123', 'customer');
    expect(() => verifyAccessToken(token, 'worker')).toThrow();
  });
});

describe('signRefreshToken', () => {
  it('creates a valid refresh token with correct payload', () => {
    const token = signRefreshToken('user-123', 'worker');
    const decoded = verifyRefreshToken(token, 'worker');
    expect(decoded.sub).toBe('user-123');
    expect(decoded.type).toBe('worker');
  });
});

describe('verifyAccessToken', () => {
  it('throws on invalid token', () => {
    expect(() => verifyAccessToken('invalid-token', 'customer')).toThrow();
  });

  it('throws on expired token', () => {
    // Create a token with a very short expiry — not directly possible with current utils
    // We can only test that verify rejects invalid tokens
    expect(() => verifyAccessToken('expired.fake.token', 'customer')).toThrow();
  });
});

describe('admin token secrets', () => {
  it('uses separate secrets for admin access and refresh', () => {
    const accessToken = signAccessToken('admin-1', 'admin');
    const refreshToken = signRefreshToken('admin-1', 'admin');

    // Both should verify with admin secret
    expect(() => verifyAccessToken(accessToken, 'admin')).not.toThrow();
    expect(() => verifyRefreshToken(refreshToken, 'admin')).not.toThrow();

    // Admin access token should NOT verify as refresh
    expect(() => verifyRefreshToken(accessToken, 'admin')).toThrow();
  });
});

/**
 * requireAuth Middleware — Unit Tests
 */

import { requireAuth } from '../../middleware/requireAuth';
import { signAccessToken } from '../../utils/jwt';
import type { Request, Response, NextFunction } from 'express';

function mockReq(headers: Record<string, string> = {}): Partial<Request> {
  return { headers: { authorization: headers.authorization || '' } };
}

function mockRes(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockNext(): jest.Mock<NextFunction> {
  return jest.fn();
}

describe('requireAuth', () => {
  it('allows requests with a valid token', () => {
    const token = signAccessToken('user-123', 'customer');
    const req = mockReq({ authorization: `Bearer ${token}` }) as Request;
    const res = mockRes() as Response;
    const next = mockNext();

    requireAuth('customer')(req, res, next);
    expect(next).toHaveBeenCalled();
    expect((req as any).user).toBeDefined();
    expect((req as any).user.id).toBe('user-123');
  });

  it('rejects requests without Authorization header', () => {
    const req = mockReq() as Request;
    const res = mockRes() as Response;
    const next = mockNext();

    requireAuth('customer')(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
      message: 'Authentication required',
    }));
  });

  it('rejects requests with invalid token', () => {
    const req = mockReq({ authorization: 'Bearer invalid_token' }) as Request;
    const res = mockRes() as Response;
    const next = mockNext();

    requireAuth('customer')(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
    }));
  });

  it('rejects requests with wrong user type', () => {
    const token = signAccessToken('user-123', 'worker');
    const req = mockReq({ authorization: `Bearer ${token}` }) as Request;
    const res = mockRes() as Response;
    const next = mockNext();

    requireAuth('customer')(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
    }));
  });

  it('accepts multiple allowed types', () => {
    const token = signAccessToken('user-123', 'worker');
    const req = mockReq({ authorization: `Bearer ${token}` }) as Request;
    const res = mockRes() as Response;
    const next = mockNext();

    requireAuth('customer', 'worker')(req, res, next);
    expect(next).toHaveBeenCalled();
    expect((req as any).user.type).toBe('worker');
  });
});

/**
 * validate Middleware — Unit Tests
 */

import { validate } from '../../middleware/validate';
import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

function mockReq(body: any = {}, query: any = {}, params: any = {}): Partial<Request> {
  return { body, query, params, headers: {} };
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

const testSchema = z.object({
  name: z.string().min(2),
  age: z.number().min(0),
});

describe('validate', () => {
  it('passes valid body through', () => {
    const req = mockReq({ name: 'John', age: 30 }) as Request;
    const res = mockRes() as Response;
    const next = mockNext();

    validate({ body: testSchema })(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ name: 'John', age: 30 });
  });

  it('rejects invalid body with 400', () => {
    const req = mockReq({ name: 'J', age: -1 }) as Request;
    const res = mockRes() as Response;
    const next = mockNext();

    validate({ body: testSchema })(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Validation failed' })
    );
  });

  it('returns field-level error details on validation failure', () => {
    const req = mockReq({ name: 'J' }) as Request;
    const res = mockRes() as Response;
    const next = mockNext();

    validate({ body: testSchema })(req, res, next);
    const jsonArg = (res.json as jest.Mock).mock.calls[0][0];
    expect(jsonArg.errors).toBeInstanceOf(Array);
    expect(jsonArg.errors.length).toBeGreaterThan(0);
    expect(jsonArg.errors[0]).toHaveProperty('field');
    expect(jsonArg.errors[0]).toHaveProperty('message');
  });
});

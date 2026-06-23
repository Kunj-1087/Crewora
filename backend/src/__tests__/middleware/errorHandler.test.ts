/**
 * Error Handler Middleware — Unit Tests
 */

import { errorHandler } from '../../middleware/errorHandler';
import { AppError } from '../../utils/AppError';
import { Prisma } from '@prisma/client';
import type { Request, Response, NextFunction } from 'express';

function mockReq(path = '/test'): Partial<Request> {
  return { path, method: 'GET', headers: {} };
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

describe('errorHandler', () => {
  it('handles AppError with status code and message', () => {
    const err = new AppError('Job not found', 404);
    const req = mockReq() as Request;
    const res = mockRes() as Response;
    const next = mockNext();

    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Job not found'),
      })
    );
  });

  it('includes error code when present on AppError', () => {
    const err = new AppError('Invalid OTP', 400, 'INVALID_OTP');
    const req = mockReq() as Request;
    const res = mockRes() as Response;
    const next = mockNext();

    errorHandler(err, req, res, next);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'INVALID_OTP',
      })
    );
  });

  it('handles Prisma P2002 unique constraint violation', () => {
    const err = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on the fields: (`phone`)',
      { code: 'P2002', clientVersion: '5.0', meta: { target: ['phone'] } }
    );
    const req = mockReq() as Request;
    const res = mockRes() as Response;
    const next = mockNext();

    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('phone'),
      })
    );
  });

  it('handles Prisma P2025 record not found', () => {
    const err = new Prisma.PrismaClientKnownRequestError(
      'Record not found',
      { code: 'P2025', clientVersion: '5.0' }
    );
    const req = mockReq() as Request;
    const res = mockRes() as Response;
    const next = mockNext();

    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('handles Prisma P2024 connection pool timeout', () => {
    const err = new Prisma.PrismaClientKnownRequestError(
      'Connection pool timeout',
      { code: 'P2024', clientVersion: '5.0' }
    );
    const req = mockReq() as Request;
    const res = mockRes() as Response;
    const next = mockNext();

    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(503);
  });

  it('handles JWT errors', () => {
    const err = new Error('jwt malformed');
    err.name = 'JsonWebTokenError';
    const req = mockReq() as Request;
    const res = mockRes() as Response;
    const next = mockNext();

    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Invalid token',
      })
    );
  });

  it('handles TokenExpiredError', () => {
    const err = new Error('jwt expired');
    err.name = 'TokenExpiredError';
    const req = mockReq() as Request;
    const res = mockRes() as Response;
    const next = mockNext();

    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Token expired',
      })
    );
  });

  it('masks unknown errors in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const err = new Error('Internal server crash');
    const req = mockReq() as Request;
    const res = mockRes() as Response;
    const next = mockNext();

    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'An unexpected error occurred',
      })
    );

    process.env.NODE_ENV = originalEnv;
  });
});

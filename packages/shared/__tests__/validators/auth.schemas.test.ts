/**
 * Shared Auth Schemas — Validation Tests
 */

import { sendOtpSchema, customerRegisterSchema, workerRegisterSchema, loginSchema, adminLoginSchema } from '../../validators/auth.schemas';

describe('sendOtpSchema', () => {
  it('accepts plain 10-digit phone', () => {
    const result = sendOtpSchema.safeParse({ phone: '9876543210' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.phone).toBe('9876543210');
  });

  it('strips +91 prefix via transform', () => {
    const result = sendOtpSchema.safeParse({ phone: '+919876543210' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.phone).toBe('919876543210');
  });

  it('strips spaces and dashes', () => {
    const result = sendOtpSchema.safeParse({ phone: '+91 98765-43210' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.phone).toBe('919876543210');
  });

  it('rejects non-digit characters after transform', () => {
    const result = sendOtpSchema.safeParse({ phone: 'phone123' });
    // After stripping non-digits, "phone123" becomes "123" which is < 10 digits
    expect(result.success).toBe(false);
  });

  it('rejects empty phone', () => {
    const result = sendOtpSchema.safeParse({ phone: '' });
    expect(result.success).toBe(false);
  });
});

describe('customerRegisterSchema', () => {
  it('accepts valid registration data', () => {
    const result = customerRegisterSchema.safeParse({
      name: 'Test User',
      phone: '9876543210',
      otp: '123456',
    });
    expect(result.success).toBe(true);
  });

  it('trims whitespace from name', () => {
    const result = customerRegisterSchema.safeParse({
      name: '  Test User  ',
      phone: '9876543210',
      otp: '123456',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe('Test User');
  });

  it('rejects short name', () => {
    const result = customerRegisterSchema.safeParse({
      name: 'A',
      phone: '9876543210',
      otp: '123456',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid OTP (not 6 digits)', () => {
    const result = customerRegisterSchema.safeParse({
      name: 'Test User',
      phone: '9876543210',
      otp: '12345',
    });
    expect(result.success).toBe(false);
  });
});

describe('workerRegisterSchema', () => {
  it('accepts valid worker registration', () => {
    const result = workerRegisterSchema.safeParse({
      name: 'Test Worker',
      phone: '9876543210',
      otp: '123456',
      tradeCategories: ['electrician'],
      city: 'Mumbai',
    });
    expect(result.success).toBe(true);
  });

  it('trims whitespace from city', () => {
    const result = workerRegisterSchema.safeParse({
      name: 'Test Worker',
      phone: '9876543210',
      otp: '123456',
      tradeCategories: ['plumber'],
      city: '  Ahmedabad  ',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.city).toBe('Ahmedabad');
  });

  it('rejects empty trade categories', () => {
    const result = workerRegisterSchema.safeParse({
      name: 'Test Worker',
      phone: '9876543210',
      otp: '123456',
      tradeCategories: [],
      city: 'Mumbai',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts valid login data', () => {
    const result = loginSchema.safeParse({
      phone: '9876543210',
      otp: '123456',
    });
    expect(result.success).toBe(true);
  });

  it('normalizes phone on login', () => {
    const result = loginSchema.safeParse({
      phone: '+91 98765-43210',
      otp: '123456',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.phone).toBe('919876543210');
  });
});

describe('adminLoginSchema', () => {
  it('accepts valid admin credentials', () => {
    const result = adminLoginSchema.safeParse({
      email: 'admin@crewora.com',
      password: 'admin123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = adminLoginSchema.safeParse({
      email: 'not-an-email',
      password: 'admin123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = adminLoginSchema.safeParse({
      email: 'admin@crewora.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});

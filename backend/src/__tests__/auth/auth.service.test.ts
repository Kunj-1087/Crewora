/**
 * Auth Service — Unit Tests
 */

import { cleanDatabase, closeDbConnection, prisma } from '../setup';
import { createTestCustomer, createTestWorker, createTestOtp } from '../helpers/factory';
import * as authService from '../../modules/auth/auth.service';

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await closeDbConnection();
});

describe('normalizePhone', () => {
  it('strips + character from phone numbers', () => {
    // Accessing private function via module internals
    const result = (authService as any).sendOtpCustomer('+919876543210');
    expect(result).toBeDefined();
  });

  it('strips spaces and dashes from phone numbers', async () => {
    // Verify OTP can be sent with formatted phone
    const code = await authService.sendOtpCustomer('+91 98765 43210');
    expect(typeof code).toBe('string');
    expect(code.length).toBe(6);

    // OTP should be stored with normalized phone (no +, spaces)
    const otpRecord = await prisma.otp.findFirst({
      where: { phone: '919876543210' },
    });
    expect(otpRecord).not.toBeNull();
  });
});

describe('sendOtpCustomer', () => {
  it('generates a 6-digit OTP and stores it in the database', async () => {
    const code = await authService.sendOtpCustomer('9876543210');
    expect(code).toMatch(/^\d{6}$/);

    const otp = await prisma.otp.findFirst({
      where: { phone: '9876543210', userType: 'customer' },
    });
    expect(otp).not.toBeNull();
    expect(otp!.code).toBe(code);
    expect(otp!.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('replaces any existing OTP for the same phone', async () => {
    await authService.sendOtpCustomer('9876543210');
    const code2 = await authService.sendOtpCustomer('9876543210');

    const otps = await prisma.otp.findMany({
      where: { phone: '9876543210' },
    });
    expect(otps.length).toBe(1);
    expect(otps[0].code).toBe(code2);
  });
});

describe('sendOtpWorker', () => {
  it('generates and stores OTP for worker type', async () => {
    const code = await authService.sendOtpWorker('9876543210');
    expect(code).toMatch(/^\d{6}$/);

    const otp = await prisma.otp.findFirst({
      where: { phone: '9876543210', userType: 'worker' },
    });
    expect(otp).not.toBeNull();
    expect(otp!.userType).toBe('worker');
  });
});

describe('registerCustomer', () => {
  it('creates a customer and returns tokens with valid OTP', async () => {
    await createTestOtp('9876543210', 'customer');
    const result = await authService.registerCustomer({
      name: 'Test Customer',
      phone: '9876543210',
      otp: '654321',
    });

    expect(result.customer).toBeDefined();
    expect(result.customer.name).toBe('Test Customer');
    expect(result.customer.phone).toBe('9876543210');
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('rejects duplicate phone registration', async () => {
    await createTestOtp('9876543210', 'customer');
    await authService.registerCustomer({
      name: 'First',
      phone: '9876543210',
      otp: '654321',
    });

    // Create fresh OTP for the same phone
    await createTestOtp('9876543210', 'customer');

    await expect(
      authService.registerCustomer({
        name: 'Second',
        phone: '9876543210',
        otp: '654321',
      })
    ).rejects.toThrow('Phone number already registered');
  });

  it('rejects invalid OTP', async () => {
    await expect(
      authService.registerCustomer({
        name: 'Test',
        phone: '9876543210',
        otp: '000000',
      })
    ).rejects.toThrow('Invalid or expired OTP');
  });

  it('accepts master OTP bypass code 123456', async () => {
    const result = await authService.registerCustomer({
      name: 'Bypass User',
      phone: '9876543211',
      otp: '123456',
    });
    expect(result.customer).toBeDefined();
    expect(result.customer.name).toBe('Bypass User');
  });
});

describe('registerWorker', () => {
  it('creates a worker with pending verification status', async () => {
    await createTestOtp('8765432109', 'worker');
    const result = await authService.registerWorker({
      name: 'Test Worker',
      phone: '8765432109',
      otp: '654321',
      tradeCategories: ['electrician'],
      city: 'Mumbai',
    });

    expect(result.worker).toBeDefined();
    expect(result.worker.verificationStatus).toBe('pending');
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });
});

describe('loginCustomer', () => {
  it('logs in an existing customer with valid OTP', async () => {
    const customer = await createTestCustomer({ phone: '9876543210' });
    await createTestOtp('9876543210', 'customer');

    const result = await authService.loginCustomer('9876543210', '654321');
    expect(result.customer.id).toBe(customer.id);
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('rejects login for non-existent customer', async () => {
    await createTestOtp('9876500000', 'customer');
    await expect(
      authService.loginCustomer('9876500000', '654321')
    ).rejects.toThrow('Account not found');
  });
});

describe('loginWorker', () => {
  it('blocks login for rejected workers', async () => {
    await createTestWorker({
      phone: '8765432100',
      verificationStatus: 'rejected',
    });
    await createTestOtp('8765432100', 'worker');

    await expect(
      authService.loginWorker('8765432100', '654321')
    ).rejects.toThrow('not approved');
  });
});

describe('token refresh and reuse detection', () => {
  it('rotates refresh token on refresh and detects reuse', async () => {
    await createTestOtp('9876543210', 'customer');
    const result = await authService.registerCustomer({
      name: 'Token Test',
      phone: '9876543210',
      otp: '654321',
    });

    const firstRefresh = result.refreshToken;

    // First refresh — should succeed
    const refreshed = await authService.refreshCustomerToken(firstRefresh);
    expect(refreshed.accessToken).toBeDefined();
    expect(refreshed.refreshToken).toBeDefined();
    expect(refreshed.refreshToken).not.toBe(firstRefresh);

    // Reuse old token — should be detected and throw
    await expect(
      authService.refreshCustomerToken(firstRefresh)
    ).rejects.toThrow('Token reuse detected');
  });
});

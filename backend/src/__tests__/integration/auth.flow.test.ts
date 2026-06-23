/**
 * Auth Flow — Integration Tests
 * Tests complete auth lifecycle: send OTP → register → login → refresh → logout
 */

import bcrypt from 'bcryptjs';
import { cleanDatabase, closeDbConnection, prisma } from '../setup';
import { createTestOtp } from '../helpers/factory';
import * as authService from '../../modules/auth/auth.service';

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await closeDbConnection();
});

describe('Customer Auth Flow', () => {
  it('completes full lifecycle: send otp → register → refresh → logout', async () => {
    // 1. Send OTP
    const code = await authService.sendOtpCustomer('9876543210');
    expect(code).toMatch(/^\d{6}$/);

    // 2. Register
    const otpRecord = await prisma.otp.findFirst({
      where: { phone: '9876543210', userType: 'customer' },
    });
    expect(otpRecord).not.toBeNull();

    // Use the actual OTP code from DB
    const registerResult = await authService.registerCustomer({
      name: 'Test Customer',
      phone: '9876543210',
      otp: otpRecord!.code,
    });

    expect(registerResult.customer).toBeDefined();
    expect(registerResult.accessToken).toBeDefined();
    expect(registerResult.refreshToken).toBeDefined();

    const firstRefreshToken = registerResult.refreshToken;

    // 3. Refresh token
    const refreshResult = await authService.refreshCustomerToken(firstRefreshToken);
    expect(refreshResult.accessToken).toBeDefined();
    expect(refreshResult.refreshToken).toBeDefined();
    expect(refreshResult.refreshToken).not.toBe(firstRefreshToken);

    // 4. Logout
    await authService.logoutCustomer(registerResult.customer.id);

    // Verify refresh token hash is null
    const customer = await prisma.customer.findUnique({
      where: { id: registerResult.customer.id },
    });
    expect(customer!.refreshTokenHash).toBeNull();
  });

  it('completes login flow for existing customer', async () => {
    // Register first
    await createTestOtp('9876543210', 'customer');
    const { customer } = await authService.registerCustomer({
      name: 'Login Test',
      phone: '9876543210',
      otp: '654321',
    });

    // Login with new OTP
    await createTestOtp('9876543210', 'customer');
    const loginResult = await authService.loginCustomer('9876543210', '654321');
    expect(loginResult.customer.id).toBe(customer.id);
    expect(loginResult.accessToken).toBeDefined();
    expect(loginResult.refreshToken).toBeDefined();
  });
});

describe('Worker Auth Flow', () => {
  it('completes full lifecycle: send otp → register → refresh → logout', async () => {
    // 1. Send OTP
    const code = await authService.sendOtpWorker('8765432109');
    expect(code).toMatch(/^\d{6}$/);

    // 2. Register
    const otpRecord = await prisma.otp.findFirst({
      where: { phone: '8765432109', userType: 'worker' },
    });

    const registerResult = await authService.registerWorker({
      name: 'Test Worker',
      phone: '8765432109',
      otp: otpRecord!.code,
      tradeCategories: ['electrician', 'plumber'],
      city: 'Mumbai',
    });

    expect(registerResult.worker).toBeDefined();
    expect(registerResult.worker.verificationStatus).toBe('pending');
    expect(registerResult.worker.tradeCategories).toContain('electrician');

    // 3. Refresh
    const refreshResult = await authService.refreshWorkerToken(registerResult.refreshToken);
    expect(refreshResult.accessToken).toBeDefined();

    // 4. Logout
    await authService.logoutWorker(registerResult.worker.id);
    const worker = await prisma.worker.findUnique({
      where: { id: registerResult.worker.id },
    });
    expect(worker!.refreshTokenHash).toBeNull();
  });
});

describe('Admin Auth Flow', () => {
  it('completes login → refresh → logout cycle', async () => {
    // Create admin directly (hashed password for 'admin123')
    const passwordHash = await bcrypt.hash('admin123', 10);
    const admin = await prisma.admin.create({
      data: {
        name: 'Super Admin',
        email: 'admin@crewora.com',
        passwordHash,
        role: 'super_admin',
      },
    });

    // Login
    const loginResult = await authService.loginAdmin('admin@crewora.com', 'admin123');
    expect(loginResult.admin).toBeDefined();
    expect(loginResult.admin.email).toBe('admin@crewora.com');
    // Verify password hash is stripped from response
    expect((loginResult.admin as any).passwordHash).toBeUndefined();

    // Refresh
    const refreshResult = await authService.refreshAdminToken(loginResult.refreshToken);
    expect(refreshResult.accessToken).toBeDefined();
    expect(refreshResult.refreshToken).toBeDefined();

    // Logout
    await authService.logoutAdmin(admin.id);
    const updatedAdmin = await prisma.admin.findUnique({ where: { id: admin.id } });
    expect(updatedAdmin!.refreshTokenHash).toBeNull();
  });

  it('rejects invalid credentials', async () => {
    await expect(
      authService.loginAdmin('admin@crewora.com', 'wrong_password')
    ).rejects.toThrow('Invalid credentials');
  });
});

describe('OTP Validation', () => {
  it('rejects expired OTP', async () => {
    // Create an already-expired OTP
    await prisma.otp.create({
      data: {
        phone: '9876543210',
        code: '111111',
        userType: 'customer',
        expiresAt: new Date(Date.now() - 60 * 1000), // 1 minute ago
      },
    });

    await expect(
      authService.registerCustomer({
        name: 'Test',
        phone: '9876543210',
        otp: '111111',
      })
    ).rejects.toThrow('Invalid or expired OTP');
  });

  it('accepts master bypass code 123456', async () => {
    const result = await authService.registerCustomer({
      name: 'Bypass User',
      phone: '9876543210',
      otp: '123456',
    });
    expect(result.customer.name).toBe('Bypass User');
  });
});

/**
 * Admin Service — Unit Tests
 */

import { cleanDatabase, closeDbConnection, prisma } from '../setup';
import { createTestCustomer, createTestWorker } from '../helpers/factory';
import * as adminService from '../../modules/admin/admin.service';

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await closeDbConnection();
});

describe('getPlatformStats', () => {
  it('returns accurate platform statistics', async () => {
    await createTestCustomer();
    await createTestCustomer({ phone: '9999900000' });
    await createTestWorker();
    await createTestWorker({ phone: '9999900001', tradeCategories: ['plumber'] });
    await createTestWorker({
      phone: '9999900002',
      verificationStatus: 'pending',
    });

    const stats = await adminService.getPlatformStats();

    expect(stats.totalCustomers).toBe(2);
    expect(stats.totalWorkers).toBe(3);
    expect(stats.pendingVerifications).toBe(1);
  });
});

describe('getVerificationQueue', () => {
  it('returns only pending workers, ordered oldest first', async () => {
    await createTestWorker({ phone: '9999900000', verificationStatus: 'approved' });
    const pendingWorker = await createTestWorker({
      phone: '9999900001',
      verificationStatus: 'pending',
    });

    const result = await adminService.getVerificationQueue(1, 10);
    expect(result.workers).toHaveLength(1);
    expect(result.workers[0].id).toBe(pendingWorker.id);
    expect(result.workers[0].verificationStatus).toBeUndefined(); // not selected
  });
});

describe('approveWorker', () => {
  it('approves a pending worker', async () => {
    const worker = await createTestWorker({ verificationStatus: 'pending' });

    const approved = await adminService.approveWorker(worker.id);
    expect(approved.verificationStatus).toBe('approved');
  });

  it('rejects approving an already approved worker', async () => {
    const worker = await createTestWorker({ verificationStatus: 'approved' });

    await expect(
      adminService.approveWorker(worker.id)
    ).rejects.toThrow('already approved');
  });

  it('throws for non-existent worker', async () => {
    await expect(
      adminService.approveWorker('00000000-0000-0000-0000-000000000000')
    ).rejects.toThrow('Worker not found');
  });
});

describe('rejectWorker', () => {
  it('rejects a worker with a reason', async () => {
    const worker = await createTestWorker({ verificationStatus: 'pending' });

    const rejected = await adminService.rejectWorker(worker.id, 'Incomplete documentation');
    expect(rejected.verificationStatus).toBe('rejected');
    expect(rejected.verificationRejectionReason).toBe('Incomplete documentation');
  });
});

describe('getAllWorkers', () => {
  it('lists workers with pagination', async () => {
    await createTestWorker();
    await createTestWorker({ phone: '9999900000', tradeCategories: ['plumber'] });

    const result = await adminService.getAllWorkers(1, 10);
    expect(result.workers.length).toBe(2);
  });

  it('filters by verification status', async () => {
    await createTestWorker({ verificationStatus: 'approved' });
    await createTestWorker({ phone: '9999900000', verificationStatus: 'pending' });

    const result = await adminService.getAllWorkers(1, 10, 'pending');
    expect(result.workers.length).toBe(1);
  });
});

describe('getAllCustomers', () => {
  it('lists active customers with pagination', async () => {
    await createTestCustomer();
    await createTestCustomer({ phone: '9999900000' });

    const result = await adminService.getAllCustomers(1, 10);
    expect(result.customers.length).toBe(2);
  });
});

describe('getAllJobs', () => {
  it('lists all jobs with pagination', async () => {
    const customer = await createTestCustomer();

    // Create jobs directly via prisma
    await prisma.job.create({
      data: {
        customerId: customer.id,
        title: 'Test job 1',
        description: 'Description for test job 1 that is long enough.',
        tradeCategory: 'plumber',
        address: 'Mumbai',
        latitude: 19.1364,
        longitude: 72.8296,
        urgency: 'asap',
        status: 'open',
      },
    });
    await prisma.job.create({
      data: {
        customerId: customer.id,
        title: 'Test job 2',
        description: 'Description for test job 2 that is long enough.',
        tradeCategory: 'electrician',
        address: 'Mumbai',
        latitude: 19.1364,
        longitude: 72.8296,
        urgency: 'asap',
        status: 'completed',
      },
    });

    const result = await adminService.getAllJobs(1, 10);
    expect(result.jobs.length).toBe(2);
  });
});

describe('deactivateUser', () => {
  it('deactivates a customer', async () => {
    const customer = await createTestCustomer();

    const deactivated = await adminService.deactivateUser(customer.id, 'customer');
    expect(deactivated.isActive).toBe(false);
  });

  it('deactivates a worker', async () => {
    const worker = await createTestWorker();

    const deactivated = await adminService.deactivateUser(worker.id, 'worker');
    expect(deactivated.isActive).toBe(false);
  });
});

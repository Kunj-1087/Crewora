/**
 * Job Service — Unit Tests
 */

import { cleanDatabase, closeDbConnection, prisma } from '../setup';
import { createTestCustomer, createTestWorker, createTestOtp } from '../helpers/factory';
import * as jobService from '../../modules/jobs/job.service';
import { signAccessToken } from '../../utils/jwt';

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await closeDbConnection();
});

const validJobData = {
  title: 'Fix a leaking pipe under the kitchen sink',
  description: 'The pipe under the kitchen sink has been leaking for two days. Need a plumber to inspect and fix it.',
  tradeCategory: 'plumber',
  location: {
    address: 'Andheri West, Mumbai, Maharashtra',
    coordinates: [72.8296, 19.1364],
  },
  urgency: 'asap',
};

describe('createJob', () => {
  it('creates a job with open status', async () => {
    const customer = await createTestCustomer();

    const job = await jobService.createJob(customer.id, validJobData);

    expect(job).toBeDefined();
    expect(job.customerId).toBe(customer.id);
    expect(job.title).toBe(validJobData.title);
    expect(job.status).toBe('open');
    expect(job.location.address).toBe('Andheri West, Mumbai, Maharashtra');
    expect(job.location.coordinates).toEqual([72.8296, 19.1364]);
  });

  it('creates a scheduled job with optional datetime', async () => {
    const customer = await createTestCustomer();

    const job = await jobService.createJob(customer.id, {
      ...validJobData,
      urgency: 'scheduled',
      scheduledAt: '2026-07-01T10:00:00.000Z',
    });

    expect(job.status).toBe('open');
    expect(job.urgency).toBe('scheduled');
  });
});

describe('getCustomerJobs', () => {
  it('returns paginated jobs for a customer', async () => {
    const customer = await createTestCustomer();
    await jobService.createJob(customer.id, validJobData);
    await jobService.createJob(customer.id, { ...validJobData, title: 'Fix electrical wiring', tradeCategory: 'electrician' });

    const result = await jobService.getCustomerJobs(customer.id, 1, 10);
    expect(result.jobs).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
    expect(result.pagination.page).toBe(1);
  });

  it('filters by status', async () => {
    const customer = await createTestCustomer();
    await jobService.createJob(customer.id, validJobData);

    const result = await jobService.getCustomerJobs(customer.id, 1, 10, 'open');
    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0].status).toBe('open');
  });
});

describe('getJobById', () => {
  it('returns job for the owning customer', async () => {
    const customer = await createTestCustomer();
    const job = await jobService.createJob(customer.id, validJobData);

    const found = await jobService.getJobById(job.id, customer.id, 'customer');
    expect(found.id).toBe(job.id);
    expect(found.title).toBe(validJobData.title);
  });

  it('throws when non-owner customer tries to access', async () => {
    const customer = await createTestCustomer();
    const otherCustomer = await createTestCustomer({ phone: '9999900000' });
    const job = await jobService.createJob(customer.id, validJobData);

    await expect(
      jobService.getJobById(job.id, otherCustomer.id, 'customer')
    ).rejects.toThrow('not authorized');
  });
});

describe('updateJob', () => {
  it('updates job title and description', async () => {
    const customer = await createTestCustomer();
    const job = await jobService.createJob(customer.id, validJobData);

    const updated = await jobService.updateJob(job.id, customer.id, {
      title: 'Updated title',
      description: 'Updated description for the job.',
    });

    expect(updated.title).toBe('Updated title');
    expect(updated.description).toBe('Updated description for the job.');
  });

  it('rejects update on completed job', async () => {
    const customer = await createTestCustomer();
    const worker = await createTestWorker();
    const job = await jobService.createJob(customer.id, validJobData);

    // Update to completed directly
    await prisma.job.update({
      where: { id: job.id },
      data: { status: 'completed' },
    });

    await expect(
      jobService.updateJob(job.id, customer.id, { title: 'New' })
    ).rejects.toThrow('Cannot update a completed or cancelled job');
  });

  it('assigns worker when assignedWorkerId is provided', async () => {
    const customer = await createTestCustomer();
    const worker = await createTestWorker();
    const job = await jobService.createJob(customer.id, validJobData);

    // Create a pending match first
    const match = await prisma.match.create({
      data: {
        jobId: job.id,
        workerId: worker.id,
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const updated = await jobService.updateJob(job.id, customer.id, {
      assignedWorkerId: worker.id,
    });

    expect(updated.status).toBe('matched');
    expect(updated.assignedWorkerId).toBe(worker.id);
  });

  it('declines other pending matches when worker is assigned', async () => {
    const customer = await createTestCustomer();
    const worker1 = await createTestWorker({ phone: '9999900001' });
    const worker2 = await createTestWorker({ phone: '9999900002' });
    const job = await jobService.createJob(customer.id, validJobData);

    await prisma.match.create({
      data: { jobId: job.id, workerId: worker1.id, status: 'pending', expiresAt: new Date(Date.now() + 86400000) },
    });
    await prisma.match.create({
      data: { jobId: job.id, workerId: worker2.id, status: 'pending', expiresAt: new Date(Date.now() + 86400000) },
    });

    await jobService.updateJob(job.id, customer.id, { assignedWorkerId: worker1.id });

    const declinedMatch = await prisma.match.findFirst({
      where: { jobId: job.id, workerId: worker2.id },
    });
    expect(declinedMatch!.status).toBe('declined');
  });

  it('rejects assigning a worker without a pending match', async () => {
    const customer = await createTestCustomer();
    const worker = await createTestWorker();
    const job = await jobService.createJob(customer.id, validJobData);

    await expect(
      jobService.updateJob(job.id, customer.id, { assignedWorkerId: worker.id })
    ).rejects.toThrow('not a pending match');
  });
});

describe('completeJob', () => {
  it('completes a matched job and creates a review', async () => {
    const customer = await createTestCustomer();
    const worker = await createTestWorker();
    const job = await jobService.createJob(customer.id, validJobData);

    // Assign worker
    await prisma.job.update({
      where: { id: job.id },
      data: { assignedWorkerId: worker.id, status: 'matched' },
    });

    const result = await jobService.completeJob(job.id, customer.id, 'customer', {
      rating: 5,
      comment: 'Excellent work!',
    });

    expect(result.job.status).toBe('completed');
    expect(result.review.rating).toBe(5);
    expect(result.review.comment).toBe('Excellent work!');
  });

  it('prevents double review from same user type', async () => {
    const customer = await createTestCustomer();
    const worker = await createTestWorker();
    const job = await jobService.createJob(customer.id, validJobData);

    await prisma.job.update({
      where: { id: job.id },
      data: { assignedWorkerId: worker.id, status: 'completed' },
    });

    await jobService.completeJob(job.id, customer.id, 'customer', { rating: 4 });

    await expect(
      jobService.completeJob(job.id, customer.id, 'customer', { rating: 5 })
    ).rejects.toThrow('already submitted feedback');
  });

  describe('respondToMatch', () => {
    it('accepts a pending match', async () => {
      const customer = await createTestCustomer();
      const worker = await createTestWorker();
      const job = await jobService.createJob(customer.id, validJobData);

      const match = await prisma.match.create({
        data: { jobId: job.id, workerId: worker.id, status: 'pending', expiresAt: new Date(Date.now() + 86400000) },
      });

      const result = await jobService.respondToMatch(match.id, worker.id, 'accept');
      expect(result.status).toBe('accepted');
    });

    it('declines a pending match', async () => {
      const customer = await createTestCustomer();
      const worker = await createTestWorker();
      const job = await jobService.createJob(customer.id, validJobData);

      const match = await prisma.match.create({
        data: { jobId: job.id, workerId: worker.id, status: 'pending', expiresAt: new Date(Date.now() + 86400000) },
      });

      const result = await jobService.respondToMatch(match.id, worker.id, 'decline');
      expect(result.status).toBe('declined');
    });

    it('prevents responding twice to the same match', async () => {
      const customer = await createTestCustomer();
      const worker = await createTestWorker();
      const job = await jobService.createJob(customer.id, validJobData);

      const match = await prisma.match.create({
        data: { jobId: job.id, workerId: worker.id, status: 'pending', expiresAt: new Date(Date.now() + 86400000) },
      });

      await jobService.respondToMatch(match.id, worker.id, 'accept');
      await expect(
        jobService.respondToMatch(match.id, worker.id, 'decline')
      ).rejects.toThrow('already been responded to');
    });
  });
});

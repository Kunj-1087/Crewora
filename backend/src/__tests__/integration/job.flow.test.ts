/**
 * Job Flow — Integration Tests
 * Tests complete job lifecycle: create → match → accept → complete
 */

import { cleanDatabase, closeDbConnection, prisma } from '../setup';
import { createTestCustomer, createTestWorker } from '../helpers/factory';
import * as jobService from '../../modules/jobs/job.service';

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await closeDbConnection();
});

describe('Complete Job Lifecycle (Customer → Worker → Complete)', () => {
  it('customer creates a job, worker is matched, worker accepts, customer completes', async () => {
    // Setup: Create customer and worker in same city
    const customer = await createTestCustomer({
      name: 'Rahul Sharma',
      phone: '9876543210',
    });

    const worker = await createTestWorker({
      name: 'Rajesh Kumar',
      phone: '8765432109',
      tradeCategories: ['plumber'],
      city: 'Mumbai',
      latitude: 19.1364,
      longitude: 72.8296,
      verificationStatus: 'approved',
    });

    // 1. Customer creates a job
    const job = await jobService.createJob(customer.id, {
      title: 'Fix leaking kitchen pipe under sink',
      description: 'The pipe under the kitchen sink has been leaking for two days. Need a plumber urgently.',
      tradeCategory: 'plumber',
      location: {
        address: 'Andheri West, Mumbai, Maharashtra',
        coordinates: [72.8296, 19.1364],
      },
      urgency: 'asap',
    });

    expect(job.status).toBe('open');

    // 2. Manually create a match (matching algorithm is async and needs DB proximity)
    const match = await prisma.match.create({
      data: {
        jobId: job.id,
        workerId: worker.id,
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Verify match exists for customer
    const matches = await jobService.getJobMatches(job.id, customer.id);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].workerId).toBeDefined();

    // 3. Worker responds to match (accept)
    const acceptResult = await jobService.respondToMatch(match.id, worker.id, 'accept');

    expect(acceptResult.status).toBe('accepted');

    // Verify job is now matched
    const acceptedJob = await jobService.getJobById(job.id, customer.id, 'customer');
    expect(acceptedJob.status).toBe('matched');
    expect(acceptedJob.assignedWorkerId).toBeDefined();

    // 4. Worker cannot accept another job while active
    const job2 = await jobService.createJob(customer.id, {
      title: 'Another plumbing job for testing',
      description: 'Need a plumber to fix a bathroom faucet that is dripping continuously.',
      tradeCategory: 'plumber',
      location: {
        address: 'Andheri West, Mumbai, Maharashtra',
        coordinates: [72.8296, 19.1364],
      },
      urgency: 'asap',
    });

    const match2 = await prisma.match.create({
      data: {
        jobId: job2.id,
        workerId: worker.id,
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await expect(
      jobService.respondToMatch(match2.id, worker.id, 'accept')
    ).rejects.toThrow('cannot accept a new job');

    // 5. Customer completes the job with rating
    const completeResult = await jobService.completeJob(
      job.id,
      customer.id,
      'customer',
      { rating: 5, comment: 'Excellent work, very professional!' }
    );

    expect(completeResult.job.status).toBe('completed');
    expect(completeResult.job.completedAt).toBeDefined();
    expect(completeResult.review.rating).toBe(5);
    expect(completeResult.review.comment).toBe('Excellent work, very professional!');

    // 6. Double review prevention
    await expect(
      jobService.completeJob(job.id, customer.id, 'customer', { rating: 4 })
    ).rejects.toThrow('already submitted feedback');
  });

  it('customer can cancel a job and decline pending matches', async () => {
    const customer = await createTestCustomer();
    const worker = await createTestWorker();

    const job = await jobService.createJob(customer.id, {
      title: 'Fix a leaking kitchen pipe',
      description: 'The kitchen pipe has been leaking for two days.',
      tradeCategory: 'plumber',
      location: {
        address: 'Andheri West, Mumbai, Maharashtra',
        coordinates: [72.8296, 19.1364],
      },
      urgency: 'asap',
    });

    // Create a pending match
    await prisma.match.create({
      data: {
        jobId: job.id,
        workerId: worker.id,
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Cancel the job
    const cancelledJob = await jobService.updateJob(job.id, customer.id, {
      status: 'cancelled',
      cancellationReason: 'Found a local plumber instead',
    });

    expect(cancelledJob.status).toBe('cancelled');
    expect(cancelledJob.cancellationReason).toBe('Found a local plumber instead');

    // Verify match was declined
    const updatedMatch = await prisma.match.findFirst({
      where: { jobId: job.id, workerId: worker.id },
    });
    expect(updatedMatch!.status).toBe('declined');
  });
});

describe('Worker Job Feed', () => {
  it('returns pending matches for a worker', async () => {
    const customer = await createTestCustomer();
    const worker = await createTestWorker();

    const job = await jobService.createJob(customer.id, {
      title: 'Electrical wiring repair',
      description: 'Need an electrician to fix faulty wiring in the living room.',
      tradeCategory: 'electrician',
      location: {
        address: 'Mumbai, Maharashtra',
        coordinates: [72.8296, 19.1364],
      },
      urgency: 'asap',
    });

    await prisma.match.create({
      data: {
        jobId: job.id,
        workerId: worker.id,
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const feed = await jobService.getWorkerJobFeed(worker.id, 1, 10, 'pending');
    expect(feed.length).toBe(1);
    expect(feed[0].jobId).toBeDefined();
  });
});

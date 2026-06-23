/**
 * Shared Job Schemas — Validation Tests
 */

import { createJobSchema, updateJobSchema, jobIdSchema, jobQuerySchema } from '../../validators/job.schemas';

const validJob = {
  title: 'Fix a leaking pipe under the kitchen sink',
  description: 'The pipe under the kitchen sink has been leaking for two days. Need a professional plumber.',
  tradeCategory: 'plumber',
  location: {
    address: 'Andheri West, Mumbai, Maharashtra',
    coordinates: [72.8296, 19.1364],
  },
  urgency: 'asap',
};

describe('createJobSchema', () => {
  it('accepts a valid job posting', () => {
    const result = createJobSchema.safeParse(validJob);
    expect(result.success).toBe(true);
  });

  it('trims whitespace from title and description', () => {
    const result = createJobSchema.safeParse({
      ...validJob,
      title: '  Fix a leaking pipe  ',
      description: '  Need a professional plumber.  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Fix a leaking pipe');
      expect(result.data.description).toBe('Need a professional plumber.');
    }
  });

  it('rejects short title (< 5 chars)', () => {
    const result = createJobSchema.safeParse({
      ...validJob,
      title: 'Fix',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short description (< 20 chars)', () => {
    const result = createJobSchema.safeParse({
      ...validJob,
      description: 'Short desc',
    });
    expect(result.success).toBe(false);
  });

  it('accepts scheduled job with valid datetime', () => {
    const result = createJobSchema.safeParse({
      ...validJob,
      urgency: 'scheduled',
      scheduledAt: '2026-07-01T10:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid trade category', () => {
    const result = createJobSchema.safeParse({
      ...validJob,
      tradeCategory: 'doctor',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateJobSchema', () => {
  it('accepts partial updates', () => {
    const result = updateJobSchema.safeParse({ title: 'Updated title' });
    expect(result.success).toBe(true);
  });

  it('accepts assignment of worker with valid UUID', () => {
    const result = updateJobSchema.safeParse({
      status: 'matched',
      assignedWorkerId: '00000000-0000-0000-0000-000000000001',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID for assignedWorkerId', () => {
    const result = updateJobSchema.safeParse({
      assignedWorkerId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('accepts cancellation with reason', () => {
    const result = updateJobSchema.safeParse({
      status: 'cancelled',
      cancellationReason: 'Found another worker',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = updateJobSchema.safeParse({
      status: 'unknown_status',
    });
    expect(result.success).toBe(false);
  });
});

describe('jobIdSchema', () => {
  it('accepts valid UUID', () => {
    const result = jobIdSchema.safeParse({ id: '00000000-0000-0000-0000-000000000001' });
    expect(result.success).toBe(true);
  });

  it('rejects non-UUID', () => {
    const result = jobIdSchema.safeParse({ id: 'abc-123' });
    expect(result.success).toBe(false);
  });
});

describe('jobQuerySchema', () => {
  it('provides defaults for page and limit', () => {
    const result = jobQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(10);
    }
  });

  it('accepts custom page and limit as strings', () => {
    const result = jobQuerySchema.safeParse({ page: '2', limit: '50' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(50);
    }
  });
});

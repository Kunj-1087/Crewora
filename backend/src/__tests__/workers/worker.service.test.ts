/**
 * Worker Service — Unit Tests
 */

import { cleanDatabase, closeDbConnection, prisma } from '../setup';
import { createTestWorker } from '../helpers/factory';
import * as workerService from '../../modules/workers/worker.service';

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await closeDbConnection();
});

describe('getWorkerProfile', () => {
  it('returns full worker profile with portfolio', async () => {
    const worker = await createTestWorker();
    const profile = await workerService.getWorkerProfile(worker.id);

    expect(profile.id).toBe(worker.id);
    expect(profile.name).toBe('Test Worker');
    expect(profile.tradeCategories).toContain('electrician');
  });

  it('throws for non-existent worker', async () => {
    await expect(
      workerService.getWorkerProfile('00000000-0000-0000-0000-000000000000')
    ).rejects.toThrow('Worker not found');
  });

  it('throws for deactivated worker', async () => {
    const worker = await createTestWorker({ isActive: false });
    await expect(
      workerService.getWorkerProfile(worker.id)
    ).rejects.toThrow('Worker not found');
  });
});

describe('updateWorkerProfile', () => {
  it('updates worker bio and rate', async () => {
    const worker = await createTestWorker();

    const updated = await workerService.updateWorkerProfile(worker.id, worker.id, {
      bio: 'New bio text',
      hourlyRate: 500,
    });

    expect(updated.bio).toBe('New bio text');
    expect(updated.hourlyRate).toBe(500);
  });

  it('rejects update by non-owner', async () => {
    const worker = await createTestWorker();
    const otherWorker = await createTestWorker({ phone: '9999900000' });

    await expect(
      workerService.updateWorkerProfile(worker.id, otherWorker.id, { bio: 'Hacked' })
    ).rejects.toThrow('not authorized');
  });
});

describe('updateAvailability', () => {
  it('updates worker availability', async () => {
    const worker = await createTestWorker();

    const updated = await workerService.updateAvailability(
      worker.id,
      worker.id,
      'unavailable'
    );

    expect(updated.availability).toBe('unavailable');
  });
});

describe('discoverWorkers', () => {
  it('returns approved, active workers', async () => {
    await createTestWorker({ name: 'Available Worker' });
    await createTestWorker({
      name: 'Unavailable Worker',
      availability: 'unavailable',
    });
    await createTestWorker({
      name: 'Pending Worker',
      verificationStatus: 'pending',
    });

    const result = await workerService.discoverWorkers({});
    expect(result.workers.length).toBeGreaterThanOrEqual(1);

    // Unavailable workers should not appear
    const unavailable = result.workers.find((w: any) => w.name === 'Unavailable Worker');
    expect(unavailable).toBeUndefined();
  });

  it('filters by trade category', async () => {
    await createTestWorker({
      name: 'Electrician Worker',
      tradeCategories: ['electrician'],
    });
    await createTestWorker({
      name: 'Plumber Worker',
      phone: '9999900001',
      tradeCategories: ['plumber'],
    });

    const result = await workerService.discoverWorkers({ tradeCategory: 'plumber' });
    expect(result.workers.length).toBe(1);
    expect(result.workers[0].name).toBe('Plumber Worker');
  });

  it('supports pagination', async () => {
    // Create multiple workers
    for (let i = 0; i < 3; i++) {
      await createTestWorker({
        name: `Worker ${i}`,
        phone: `99999000${i}`,
      });
    }

    const result = await workerService.discoverWorkers({ page: 1, limit: 2 });
    expect(result.workers.length).toBeLessThanOrEqual(2);
    expect(result.pagination.total).toBeGreaterThanOrEqual(3);
  });
});

describe('addPortfolioItem', () => {
  it('adds an item to worker portfolio', async () => {
    const worker = await createTestWorker();

    const item = await workerService.addPortfolioItem(
      worker.id,
      'Kitchen Renovation',
      'https://example.com/photo.jpg'
    );

    expect(item.title).toBe('Kitchen Renovation');
    expect(item.image).toBe('https://example.com/photo.jpg');
    expect(item.workerId).toBe(worker.id);
  });
});

describe('removePortfolioItem', () => {
  it('removes an item from worker portfolio', async () => {
    const worker = await createTestWorker();

    const item = await workerService.addPortfolioItem(
      worker.id,
      'Bathroom Tiling',
      'https://example.com/tile.jpg'
    );

    const result = await workerService.removePortfolioItem(worker.id, item.id);
    expect(result.success).toBe(true);

    // Verify deletion
    const portfolio = await prisma.portfolioItem.findMany({
      where: { workerId: worker.id },
    });
    expect(portfolio).toHaveLength(0);
  });

  it('rejects removal by non-owner', async () => {
    const worker = await createTestWorker();
    const otherWorker = await createTestWorker({ phone: '9999900000' });

    const item = await workerService.addPortfolioItem(
      worker.id,
      'Deck Building',
      'https://example.com/deck.jpg'
    );

    await expect(
      workerService.removePortfolioItem(otherWorker.id, item.id)
    ).rejects.toThrow('Unauthorized');
  });
});

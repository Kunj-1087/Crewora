/**
 * Redis Caching Utility
 *
 * Provides:
 * - getOrSet(key, ttl, fetchFn) — check cache first, call fetch if miss, store result
 * - invalidate(keyPattern) — delete by key or pattern
 * - Graceful degradation: if Redis is down, fall through to DB without crashing
 *
 * Cache invalidation patterns:
 *   requests:open:page:1:category:plumber  → 30s TTL
 *   provider:profile:abc123                → 5min TTL
 *   reviews:provider:abc123                → 10min TTL
 *   admin:stats                            → 60s TTL
 */

import { logger } from './logger';
import { env } from '../config/env';

// ─── Redis Client (lazy-init) ────────────────────────────────────────────────

let redisClient: any = null;
let redisAvailable = false;

function getRedis(): any {
  if (redisClient) return redisClient;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Redis = require('ioredis');
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      retryStrategy: (times: number) => {
        if (times > 2) {
          redisAvailable = false;
          logger.warn('Redis cache unavailable — falling through to database', { retries: times });
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      redisAvailable = true;
      logger.info('Redis cache connected');
    });

    redisClient.on('error', (err: Error) => {
      redisAvailable = false;
      logger.warn('Redis cache error — falling through to database', {
        error: err.message,
      });
    });

    redisClient.on('close', () => {
      redisAvailable = false;
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis cache reconnecting...');
    });

    return redisClient;
  } catch (err) {
    redisAvailable = false;
    logger.warn('Failed to initialize Redis cache — falling through to database', { err });
    return null;
  }
}

// Initialize on module load
getRedis();

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Check cache first. If miss, call fetchFn, store result in cache, return it.
 * If Redis is unavailable, calls fetchFn directly and returns without caching.
 */
export async function getOrSet<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  if (!redisAvailable || !redisClient) {
    return fetchFn();
  }

  try {
    const cached = await redisClient.get(key);
    if (cached !== null && cached !== undefined) {
      try {
        return JSON.parse(cached) as T;
      } catch {
        // Cache corrupted — fall through
        logger.warn('Cache corruption detected for key', { key });
      }
    }

    const fresh = await fetchFn();
    const serialized = JSON.stringify(fresh);

    await redisClient.setex(key, ttlSeconds, serialized).catch(() => {
      // Non-blocking cache write failure
    });

    return fresh;
  } catch (err) {
    logger.warn('Cache lookup failed — falling through to database', {
      key,
      error: err instanceof Error ? err.message : err,
    });
    return fetchFn();
  }
}

/**
 * Invalidate cache entries by exact key or pattern.
 * Pattern invalidation uses SCAN to avoid blocking Redis.
 */
export async function invalidate(keyOrPattern: string): Promise<void> {
  if (!redisAvailable || !redisClient) return;

  try {
    // If it contains wildcards, scan and delete
    if (keyOrPattern.includes('*')) {
      let cursor = '0';
      do {
        const result = await redisClient.scan(cursor, 'MATCH', keyOrPattern, 'COUNT', 100);
        cursor = result[0];
        const keys: string[] = result[1];

        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } while (cursor !== '0');
    } else {
      await redisClient.del(keyOrPattern);
    }
  } catch (err) {
    logger.warn('Cache invalidation failed', {
      pattern: keyOrPattern,
      error: err instanceof Error ? err.message : err,
    });
  }
}

/**
 * Invalidate multiple cache patterns in parallel.
 */
export async function invalidateAll(patterns: string[]): Promise<void> {
  await Promise.all(patterns.map((p) => invalidate(p)));
}

/**
 * Check if Redis is currently available.
 */
export function isCacheAvailable(): boolean {
  return redisAvailable;
}

// ─── Pre-defined Cache Configurations ─────────────────────────────────────────

export const CACHE_KEYS = {
  openRequests: (page: number, category?: string) =>
    `requests:open:page:${page}:category:${category || 'all'}`,
  providerProfile: (workerId: string) => `provider:profile:${workerId}`,
  providerReviews: (workerId: string) => `reviews:provider:${workerId}`,
  adminStats: 'admin:stats',
} as const;

export const CACHE_TTL = {
  openRequests: 30,      // 30 seconds
  providerProfile: 300,  // 5 minutes
  providerReviews: 600,  // 10 minutes
  adminStats: 60,        // 1 minute
} as const;

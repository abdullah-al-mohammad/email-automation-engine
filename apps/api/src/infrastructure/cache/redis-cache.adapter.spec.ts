import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CACHE_TYPE, REDIS_URL } from '../config/config-keys';
import { RedisCacheAdapter } from './redis-cache.adapter';

describe('RedisCacheAdapter', () => {
  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns cache misses when redis is disabled', async () => {
    const cache = new RedisCacheAdapter(
      new ConfigService({
        [CACHE_TYPE]: 'in-memory',
      }),
    );

    await expect(cache.get('key')).resolves.toBeNull();
    await expect(cache.set('key', 'value')).resolves.toBeUndefined();
    await expect(cache.del('key')).resolves.toBeUndefined();
  });

  it('returns cache misses when redis get fails', async () => {
    const redis = {
      get: vi.fn().mockRejectedValue(new Error('unavailable')),
      on: vi.fn(),
      quit: vi.fn(),
    };
    const cache = new RedisCacheAdapter(
      new ConfigService({
        [CACHE_TYPE]: 'redis',
        [REDIS_URL]: 'redis://localhost:6379',
      }),
      redis as never,
    );

    await expect(cache.get('key')).resolves.toBeNull();
  });
});

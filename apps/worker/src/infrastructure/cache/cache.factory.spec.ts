import { describe, expect, it, vi } from 'vitest';
import { createCacheService } from './cache.factory';
import { InMemoryCacheAdapter } from './in-memory-cache.adapter';
import { RedisCacheAdapter } from './redis-cache.adapter';

vi.mock('ioredis', () => ({
  default: vi.fn(function RedisMock() {
    return {
      del: vi.fn(),
      get: vi.fn(),
      quit: vi.fn(),
      set: vi.fn(),
    };
  }),
}));

describe('createCacheService', () => {
  it('selects the in-memory adapter by default', () => {
    expect(createCacheService({})).toBeInstanceOf(InMemoryCacheAdapter);
  });

  it('selects the Redis adapter when configured', () => {
    expect(
      createCacheService({ cacheType: 'redis', redisUrl: 'redis://localhost:6379' }),
    ).toBeInstanceOf(RedisCacheAdapter);
  });

  it('fails clearly when redis is selected without a URL', () => {
    expect(() => createCacheService({ cacheType: 'redis' })).toThrow(
      'redisUrl is required when cacheType is redis.',
    );
  });
});

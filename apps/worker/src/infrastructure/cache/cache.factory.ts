import { type CacheService } from './cache.interface';
import { InMemoryCacheAdapter } from './in-memory-cache.adapter';
import { RedisCacheAdapter, type RedisCacheConfig } from './redis-cache.adapter';

export type CacheConfig = RedisCacheConfig;

export function createCacheService(config: CacheConfig): CacheService {
  if (config.cacheType === 'redis') {
    return new RedisCacheAdapter(config);
  }

  return new InMemoryCacheAdapter();
}

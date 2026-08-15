import Redis from 'ioredis';

import { type CacheService } from './cache.interface';

export interface RedisCacheConfig {
  cacheType?: string;
  redisUrl?: string;
}

export class RedisCacheAdapter implements CacheService {
  private readonly redis: Redis | null = null;
  private readonly isEnabled: boolean;

  constructor(config: RedisCacheConfig, redisClient?: Redis) {
    this.isEnabled = config.cacheType === 'redis';

    if (this.isEnabled) {
      if (!config.redisUrl) {
        throw new Error('redisUrl is required when cacheType is redis.');
      }

      this.redis =
        redisClient ??
        new Redis(config.redisUrl, {
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
        });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled || !this.redis) return null;

    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!this.isEnabled || !this.redis) return;

    try {
      const stringValue = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.set(key, stringValue, 'EX', ttlSeconds);
      } else {
        await this.redis.set(key, stringValue);
      }
    } catch {
      return;
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isEnabled || !this.redis) return;

    try {
      await this.redis.del(key);
    } catch {
      return;
    }
  }

  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

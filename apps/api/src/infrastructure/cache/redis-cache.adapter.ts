import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import { CACHE_TYPE, REDIS_URL } from '../config/config-keys';
import type { ICacheService } from './cache.interface';

@Injectable()
export class RedisCacheAdapter implements ICacheService, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheAdapter.name);
  private readonly redis: Redis | null = null;
  private readonly isEnabled: boolean;

  constructor(configService: ConfigService, redisClient?: Redis) {
    const redisUrl = configService.get<string>(REDIS_URL as string);
    const isRedisSelected = configService.get<string>(CACHE_TYPE as string) === 'redis';

    if (isRedisSelected && !redisUrl) {
      throw new Error('REDIS_URL must be provided when CACHE_TYPE is set to "redis"');
    }

    this.isEnabled = isRedisSelected;

    if (this.isEnabled) {
      this.redis =
        redisClient ??
        new Redis(redisUrl as string, {
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
        });

      this.redis.on('error', (error) => {
        this.logger.error('Redis connection error', error);
      });

      this.redis.on('connect', () => {
        this.logger.log('Successfully connected to Redis');
      });
    } else {
      this.logger.warn(
        'Redis is disabled. Cache operations will be ignored (fallback to database).',
      );
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled || !this.redis) return null;

    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.warn(`Failed to get cache key: ${key}`, error);
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
    } catch (error) {
      this.logger.warn(`Failed to set cache key: ${key}`, error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isEnabled || !this.redis) return;

    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.warn(`Failed to delete cache key: ${key}`, error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

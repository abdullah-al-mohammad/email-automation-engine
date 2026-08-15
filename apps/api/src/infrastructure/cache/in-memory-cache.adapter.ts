import { Injectable, Logger } from '@nestjs/common';

import type { ICacheService } from './cache.interface';

@Injectable()
export class InMemoryCacheAdapter implements ICacheService {
  private readonly logger = new Logger(InMemoryCacheAdapter.name);
  private readonly cache = new Map<string, { value: unknown; expiresAt: number | null }>();

  get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) return Promise.resolve(null);

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return Promise.resolve(null);
    }

    this.logger.debug(`Cache hit for in-memory key: ${key}`);
    return Promise.resolve(entry.value as T);
  }

  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.cache.set(key, { value, expiresAt });
    return Promise.resolve();
  }

  del(key: string): Promise<void> {
    this.cache.delete(key);
    return Promise.resolve();
  }
}

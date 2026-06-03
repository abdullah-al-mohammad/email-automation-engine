import { Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InMemoryCacheAdapter } from './in-memory-cache.adapter';

describe('InMemoryCacheAdapter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('returns cached values and deletes keys', async () => {
    vi.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    const cache = new InMemoryCacheAdapter();

    await cache.set('key', { value: 1 });

    await expect(cache.get<{ value: number }>('key')).resolves.toEqual({ value: 1 });

    await cache.del('key');

    await expect(cache.get('key')).resolves.toBeNull();
  });

  it('expires values after ttl', async () => {
    vi.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    vi.useFakeTimers();
    const cache = new InMemoryCacheAdapter();

    await cache.set('key', 'value', 1);
    vi.advanceTimersByTime(1001);

    await expect(cache.get('key')).resolves.toBeNull();
  });
});

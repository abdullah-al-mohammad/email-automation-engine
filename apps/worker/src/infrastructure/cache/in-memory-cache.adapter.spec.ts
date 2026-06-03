import { describe, expect, it, vi } from 'vitest';
import { InMemoryCacheAdapter } from './in-memory-cache.adapter';

describe('worker InMemoryCacheAdapter', () => {
  it('expires values after ttl', async () => {
    vi.useFakeTimers();
    const cache = new InMemoryCacheAdapter();

    await cache.set('key', 'value', 1);
    vi.advanceTimersByTime(1001);

    await expect(cache.get('key')).resolves.toBeNull();

    vi.useRealTimers();
  });
});

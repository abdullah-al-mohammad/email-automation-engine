import { describe, expect, it } from 'vitest';

import { InMemoryQueueAdapter } from './in-memory-queue.adapter';

describe('worker InMemoryQueueAdapter', () => {
  it('stores batch messages and reports generated successful ids', async () => {
    const queue = new InMemoryQueueAdapter();

    const result = await queue.sendMessages('queue-url', [{ id: '1' }, { id: '2' }]);

    expect(result.successfulIds).toHaveLength(2);
    expect(result.failedIds).toEqual([]);
    expect(queue.queues.get('queue-url')).toHaveLength(2);
  });
});

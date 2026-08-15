import { Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { InMemoryQueueAdapter } from './in-memory-queue.adapter';

describe('InMemoryQueueAdapter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stores single messages with options', async () => {
    vi.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    const queue = new InMemoryQueueAdapter();

    await queue.sendMessage('queue-url', { id: '1' }, { messageGroupId: 'tenant-1' });

    expect(queue.queues.get('queue-url')).toMatchObject([
      {
        message: { id: '1' },
        options: { messageGroupId: 'tenant-1' },
      },
    ]);
  });

  it('stores batch messages and reports generated successful ids', async () => {
    vi.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    const queue = new InMemoryQueueAdapter();

    const result = await queue.sendMessages('queue-url', [{ id: '1' }, { id: '2' }]);

    expect(result.successfulIds).toHaveLength(2);
    expect(result.failedIds).toEqual([]);
    expect(queue.queues.get('queue-url')).toHaveLength(2);
  });
});

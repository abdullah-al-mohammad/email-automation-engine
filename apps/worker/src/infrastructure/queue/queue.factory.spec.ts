import { describe, expect, it } from 'vitest';

import { InMemoryQueueAdapter } from './in-memory-queue.adapter';
import { createQueueService } from './queue.factory';
import { SqsQueueAdapter } from './sqs-queue.adapter';

describe('createQueueService', () => {
  it('selects the in-memory adapter by default', () => {
    expect(createQueueService({})).toBeInstanceOf(InMemoryQueueAdapter);
  });

  it('selects the SQS adapter when configured', () => {
    expect(createQueueService({ queueType: 'sqs' })).toBeInstanceOf(SqsQueueAdapter);
  });
});

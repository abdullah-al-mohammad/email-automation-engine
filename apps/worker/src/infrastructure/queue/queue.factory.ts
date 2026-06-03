import { InMemoryQueueAdapter } from './in-memory-queue.adapter';
import { type QueueService } from './queue.interface';
import { SqsQueueAdapter, type SqsQueueConfig } from './sqs-queue.adapter';

export interface QueueConfig extends SqsQueueConfig {
  queueType?: string;
}

export function createQueueService(config: QueueConfig): QueueService {
  if (config.queueType === 'sqs') {
    return new SqsQueueAdapter(config);
  }

  return new InMemoryQueueAdapter();
}

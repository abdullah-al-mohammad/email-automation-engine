import { randomUUID } from 'crypto';
import { type QueueService, type SendMessageOptions } from './queue.interface';

export interface InMemoryQueuedMessage<T = unknown> {
  message: T;
  options?: SendMessageOptions;
  timestamp: number;
}

export class InMemoryQueueAdapter implements QueueService {
  public readonly queues = new Map<string, InMemoryQueuedMessage[]>();

  sendMessage<T>(queueUrl: string, message: T, options?: SendMessageOptions): Promise<void> {
    if (!this.queues.has(queueUrl)) {
      this.queues.set(queueUrl, []);
    }

    this.queues.get(queueUrl)!.push({
      message,
      options,
      timestamp: Date.now(),
    });

    return Promise.resolve();
  }

  sendMessages<T>(
    queueUrl: string,
    messages: T[],
    options?: SendMessageOptions,
  ): Promise<{ successfulIds: string[]; failedIds: string[] }> {
    if (!this.queues.has(queueUrl)) {
      this.queues.set(queueUrl, []);
    }

    const successfulIds: string[] = [];

    messages.forEach((message) => {
      this.queues.get(queueUrl)!.push({
        message,
        options,
        timestamp: Date.now(),
      });
      successfulIds.push(randomUUID());
    });

    return Promise.resolve({ successfulIds, failedIds: [] });
  }
}

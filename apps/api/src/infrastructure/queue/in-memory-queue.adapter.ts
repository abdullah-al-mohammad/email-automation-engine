import { Injectable, Logger } from '@nestjs/common';
import type { IQueueService, SendMessageOptions } from './queue.interface';
import { randomUUID } from 'crypto';

export interface InMemoryQueuedMessage<T = unknown> {
  message: T;
  options?: SendMessageOptions;
  timestamp: number;
}

@Injectable()
export class InMemoryQueueAdapter implements IQueueService {
  private readonly logger = new Logger(InMemoryQueueAdapter.name);

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

    this.logger.debug(`Message pushed to in-memory queue: ${queueUrl}`);
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

    messages.forEach((msg) => {
      this.queues.get(queueUrl)!.push({
        message: msg,
        options,
        timestamp: Date.now(),
      });
      successfulIds.push(randomUUID());
    });

    this.logger.debug(
      `Batch of ${messages.length} messages pushed to in-memory queue: ${queueUrl}`,
    );

    return Promise.resolve({ successfulIds, failedIds: [] });
  }
}

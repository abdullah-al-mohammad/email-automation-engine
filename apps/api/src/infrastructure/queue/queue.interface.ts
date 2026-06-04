export const QUEUE_SERVICE = Symbol('QUEUE_SERVICE');

export interface SendMessageOptions {
  messageGroupId?: string;
  messageDeduplicationId?: string;
}

export interface IQueueService {
  sendMessage<T>(queueName: string, message: T, options?: SendMessageOptions): Promise<void>;

  sendMessages<T>(
    queueName: string,
    messages: T[],
    options?: SendMessageOptions,
  ): Promise<{ successfulIds: string[]; failedIds: string[] }>;
}

export const QUEUE_SERVICE = Symbol('QUEUE_SERVICE');

export interface SendMessageOptions {
  messageGroupId?: string;
  messageDeduplicationId?: string;
}

export interface QueueService {
  sendMessage<T>(queueUrl: string, message: T, options?: SendMessageOptions): Promise<void>;
  sendMessages<T>(
    queueUrl: string,
    messages: T[],
    options?: SendMessageOptions,
  ): Promise<{ successfulIds: string[]; failedIds: string[] }>;
}

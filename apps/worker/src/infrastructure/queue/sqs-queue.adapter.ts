import {
  type SQSClientConfig,
  SQSClient,
  SendMessageBatchCommand,
  SendMessageCommand,
} from '@aws-sdk/client-sqs';
import { randomUUID } from 'crypto';
import { type QueueService, type SendMessageOptions } from './queue.interface';

export interface SqsQueueConfig {
  awsRegion?: string;
  sqsEndpointUrl?: string;
}

export class SqsQueueAdapter implements QueueService {
  private readonly sqsClient: SQSClient;

  constructor(config: SqsQueueConfig, sqsClient?: SQSClient) {
    const clientConfig: SQSClientConfig = {
      region: config.awsRegion ?? 'us-east-1',
    };

    if (config.sqsEndpointUrl) {
      clientConfig.endpoint = config.sqsEndpointUrl;
    }

    this.sqsClient = sqsClient ?? new SQSClient(clientConfig);
  }

  async sendMessage<T>(queueUrl: string, message: T, options?: SendMessageOptions): Promise<void> {
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
      MessageGroupId: options?.messageGroupId,
      MessageDeduplicationId: options?.messageDeduplicationId,
    });

    try {
      await this.sqsClient.send(command);
    } catch (error) {
      console.error(`Failed to send message to SQS queue ${queueUrl}`, error);
      throw error;
    }
  }

  async sendMessages<T>(
    queueUrl: string,
    messages: T[],
    options?: SendMessageOptions,
  ): Promise<{ successfulIds: string[]; failedIds: string[] }> {
    if (messages.length === 0) {
      return { successfulIds: [], failedIds: [] };
    }

    const entries = messages.map((message) => ({
      Id: randomUUID(),
      MessageBody: JSON.stringify(message),
      MessageGroupId: options?.messageGroupId,
      MessageDeduplicationId: options?.messageDeduplicationId,
    }));
    const successfulIds: string[] = [];
    const failedIds: string[] = [];

    for (let index = 0; index < entries.length; index += 10) {
      const chunk = entries.slice(index, index + 10);
      const command = new SendMessageBatchCommand({
        QueueUrl: queueUrl,
        Entries: chunk,
      });

      try {
        const response = await this.sqsClient.send(command);

        response.Successful?.forEach((entry) => {
          if (entry.Id) successfulIds.push(entry.Id);
        });
        response.Failed?.forEach((entry) => {
          if (entry.Id) failedIds.push(entry.Id);
        });
      } catch (error) {
        console.error(`Failed to send message batch to SQS queue ${queueUrl}`, error);
        chunk.forEach((entry) => failedIds.push(entry.Id));
      }
    }

    return { successfulIds, failedIds };
  }
}

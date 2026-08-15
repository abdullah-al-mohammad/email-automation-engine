import {
  SendMessageBatchCommand,
  SendMessageCommand,
  SQSClient,
  type SQSClientConfig,
} from '@aws-sdk/client-sqs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

import { AWS_REGION, AWS_SQS_ENDPOINT_URL } from '../config/config-keys';
import type { IQueueService, SendMessageOptions } from './queue.interface';

@Injectable()
export class SqsQueueAdapter implements IQueueService {
  private readonly logger = new Logger(SqsQueueAdapter.name);
  private readonly sqsClient: SQSClient;

  constructor(configService: ConfigService, sqsClient?: SQSClient) {
    const config: SQSClientConfig = {
      region: configService.get<string>(AWS_REGION) ?? 'us-east-1',
    };
    const endpoint = configService.get<string>(AWS_SQS_ENDPOINT_URL);

    if (endpoint) {
      config.endpoint = endpoint;
    }

    this.sqsClient = sqsClient ?? new SQSClient(config);
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
      this.logger.error(`Failed to send message to SQS: ${queueUrl}`, error);
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

    const entries = messages.map((msg) => ({
      Id: randomUUID(),
      MessageBody: JSON.stringify(msg),
      MessageGroupId: options?.messageGroupId,
      MessageDeduplicationId: options?.messageDeduplicationId,
    }));

    // SQS batch send allows a maximum of 10 messages per request.
    // We chunk the messages into arrays of 10 to process all of them properly.
    const chunks = [];
    for (let i = 0; i < entries.length; i += 10) {
      chunks.push(entries.slice(i, i + 10));
    }

    const successfulIds: string[] = [];
    const failedIds: string[] = [];

    for (const chunk of chunks) {
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
        this.logger.error(`Failed to send batch messages to SQS: ${queueUrl}`, error);
        chunk.forEach((entry) => failedIds.push(entry.Id));
      }
    }

    return { successfulIds, failedIds };
  }
}

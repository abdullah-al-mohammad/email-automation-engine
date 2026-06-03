import { SendMessageBatchCommand, SendMessageCommand } from '@aws-sdk/client-sqs';
import { describe, expect, it, vi } from 'vitest';
import { SqsQueueAdapter } from './sqs-queue.adapter';

describe('worker SqsQueueAdapter', () => {
  it('sends JSON body and FIFO options with a single message', async () => {
    const client = {
      send: vi.fn().mockResolvedValue({}),
    };
    const queue = new SqsQueueAdapter({}, client as never);

    await queue.sendMessage(
      'queue-url',
      { id: '1' },
      { messageGroupId: 'group-1', messageDeduplicationId: 'dedupe-1' },
    );

    const command = client.send.mock.calls[0][0] as SendMessageCommand;
    expect(command).toBeInstanceOf(SendMessageCommand);
    expect(command.input).toMatchObject({
      QueueUrl: 'queue-url',
      MessageBody: JSON.stringify({ id: '1' }),
      MessageGroupId: 'group-1',
      MessageDeduplicationId: 'dedupe-1',
    });
  });

  it('chunks batch sends and tracks successful and failed ids', async () => {
    const client = {
      send: vi
        .fn()
        .mockResolvedValueOnce({
          Successful: [{ Id: 'first' }],
          Failed: [{ Id: 'second' }],
        })
        .mockRejectedValueOnce(new Error('sqs down')),
    };
    const queue = new SqsQueueAdapter(
      {
        awsRegion: 'us-west-2',
        sqsEndpointUrl: 'http://localhost:4566',
      },
      client as never,
    );

    const result = await queue.sendMessages(
      'queue-url',
      Array.from({ length: 11 }, (_, index) => ({ id: index })),
    );

    expect(client.send).toHaveBeenCalledTimes(2);
    expect(client.send.mock.calls[0][0]).toBeInstanceOf(SendMessageBatchCommand);
    expect((client.send.mock.calls[0][0] as SendMessageBatchCommand).input.Entries).toHaveLength(
      10,
    );
    expect((client.send.mock.calls[1][0] as SendMessageBatchCommand).input.Entries).toHaveLength(1);
    expect(result.successfulIds).toEqual(['first']);
    expect(result.failedIds).toHaveLength(2);
  });

  it('returns no ids for empty batches', async () => {
    const client = {
      send: vi.fn(),
    };
    const queue = new SqsQueueAdapter({}, client as never);

    await expect(queue.sendMessages('queue-url', [])).resolves.toEqual({
      successfulIds: [],
      failedIds: [],
    });
    expect(client.send).not.toHaveBeenCalled();
  });
});

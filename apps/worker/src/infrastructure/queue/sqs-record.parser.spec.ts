import { describe, expect, it } from 'vitest';

import { parseSqsRecords } from './sqs-record.parser';

interface VersionedMessage {
  version: 1;
  id: string;
}

function isVersionedMessage(value: unknown): value is VersionedMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'version' in value &&
    value.version === 1 &&
    'id' in value &&
    typeof value.id === 'string'
  );
}

describe('parseSqsRecords', () => {
  it('returns parsed messages and partial batch failures', () => {
    const result = parseSqsRecords(
      {
        Records: [
          { messageId: 'valid', body: JSON.stringify({ version: 1, id: 'message-1' }) },
          { messageId: 'invalid-json', body: '{' },
          {
            messageId: 'unsupported-version',
            body: JSON.stringify({ version: 2, id: 'message-2' }),
          },
        ],
      },
      isVersionedMessage,
    );

    expect(result.records).toEqual([
      { messageId: 'valid', message: { version: 1, id: 'message-1' } },
    ]);
    expect(result.failures).toEqual({
      batchItemFailures: [
        { itemIdentifier: 'invalid-json' },
        { itemIdentifier: 'unsupported-version' },
      ],
    });
  });
});

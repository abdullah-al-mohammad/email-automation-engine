export interface SqsRecord {
  messageId: string;
  body: string;
}

export interface SqsBatchEvent {
  Records: SqsRecord[];
}

export interface ParsedSqsRecord<T> {
  messageId: string;
  message: T;
}

export interface SqsBatchResponse {
  batchItemFailures: Array<{ itemIdentifier: string }>;
}

export function parseSqsRecords<T>(
  event: SqsBatchEvent,
  isMessage: (value: unknown) => value is T,
): { records: Array<ParsedSqsRecord<T>>; failures: SqsBatchResponse } {
  const records: Array<ParsedSqsRecord<T>> = [];
  const batchItemFailures: Array<{ itemIdentifier: string }> = [];

  event.Records.forEach((record) => {
    try {
      const value: unknown = JSON.parse(record.body);

      if (!isMessage(value)) {
        batchItemFailures.push({ itemIdentifier: record.messageId });
        return;
      }

      records.push({ messageId: record.messageId, message: value });
    } catch {
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  });

  return { records, failures: { batchItemFailures } };
}

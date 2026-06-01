import { describe, expect, it } from 'vitest';
import { queueMessageEnvelopeSchema } from './queue-message';

describe('queueMessageEnvelopeSchema', () => {
  it('accepts a versioned queue message envelope', () => {
    const result = queueMessageEnvelopeSchema.safeParse({
      version: 1,
      messageId: '00000000-0000-4000-8000-000000000001',
      tenantId: '00000000-0000-4000-8000-000000000002',
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    expect(result.success).toBe(true);
  });

  it('rejects unversioned queue message envelopes', () => {
    const result = queueMessageEnvelopeSchema.safeParse({
      messageId: '00000000-0000-4000-8000-000000000001',
      tenantId: '00000000-0000-4000-8000-000000000002',
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    expect(result.success).toBe(false);
  });
});

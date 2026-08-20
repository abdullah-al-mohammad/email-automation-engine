import { describe, expect, it } from 'vitest';

import {
  emailTrackingEventMessageSchema,
  isEmailTrackingEventMessage,
} from './email-tracking-event.message';

describe('emailTrackingEventMessageSchema', () => {
  const validMessage = {
    version: 1,
    messageId: '123e4567-e89b-12d3-a456-426614174000',
    tenantId: '123e4567-e89b-12d3-a456-426614174001',
    createdAt: '2024-01-01T00:00:00Z',
    contactId: '123e4567-e89b-12d3-a456-426614174002',
    emailMessageId: '123e4567-e89b-12d3-a456-426614174003',
    eventType: 'opened',
    url: 'https://example.com',
    metadata: { browser: 'Chrome' },
    occurredAt: '2024-01-01T00:01:00Z',
  };

  it('accepts valid messages', () => {
    expect(emailTrackingEventMessageSchema.safeParse(validMessage).success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const { eventType, ...invalid } = validMessage;
    expect(eventType).toBeDefined();
    expect(emailTrackingEventMessageSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects wrong version', () => {
    const invalid = { ...validMessage, version: 2 };
    expect(emailTrackingEventMessageSchema.safeParse(invalid).success).toBe(false);
  });

  it('type guard returns true for valid', () => {
    expect(isEmailTrackingEventMessage(validMessage)).toBe(true);
  });

  it('type guard returns false for invalid', () => {
    const invalid = { ...validMessage, version: 2 };
    expect(isEmailTrackingEventMessage(invalid)).toBe(false);
  });
});

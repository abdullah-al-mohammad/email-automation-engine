import { describe, it, expect } from 'vitest';
import { automationEventMessageSchema, isAutomationEventMessage } from './automation-event.message';

describe('automationEventMessageSchema', () => {
  const validMessage = {
    version: 1,
    messageId: '123e4567-e89b-12d3-a456-426614174000',
    tenantId: '123e4567-e89b-12d3-a456-426614174001',
    createdAt: '2024-01-01T00:00:00Z',
    contactId: '123e4567-e89b-12d3-a456-426614174002',
    event: 'contact.subscribed',
    metadata: { source: 'web' },
    occurredAt: '2024-01-01T00:00:00Z',
    matchedTriggerIds: ['123e4567-e89b-12d3-a456-426614174003'],
    matchedWorkflowIds: ['123e4567-e89b-12d3-a456-426614174004'],
  };

  it('accepts valid messages', () => {
    expect(automationEventMessageSchema.safeParse(validMessage).success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const invalid = { ...validMessage };
    // @ts-ignore
    delete invalid.event;
    expect(automationEventMessageSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects wrong version', () => {
    const invalid = { ...validMessage, version: 2 };
    expect(automationEventMessageSchema.safeParse(invalid).success).toBe(false);
  });

  it('type guard returns true for valid', () => {
    expect(isAutomationEventMessage(validMessage)).toBe(true);
  });

  it('type guard returns false for invalid', () => {
    const invalid = { ...validMessage, version: 2 };
    expect(isAutomationEventMessage(invalid)).toBe(false);
  });
});

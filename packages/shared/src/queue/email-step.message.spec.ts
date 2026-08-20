import { describe, expect, it } from 'vitest';

import { emailStepMessageSchema, isEmailStepMessage } from './email-step.message';

describe('emailStepMessageSchema', () => {
  const validMessage = {
    version: 1,
    messageId: '123e4567-e89b-12d3-a456-426614174000',
    tenantId: '123e4567-e89b-12d3-a456-426614174001',
    createdAt: '2024-01-01T00:00:00Z',
    contactId: '123e4567-e89b-12d3-a456-426614174002',
    contactWorkflowId: '123e4567-e89b-12d3-a456-426614174003',
    workflowId: '123e4567-e89b-12d3-a456-426614174004',
    workflowStepId: '123e4567-e89b-12d3-a456-426614174005',
    contactWorkflowStepId: '123e4567-e89b-12d3-a456-426614174006',
    action: 'send_email',
  };

  it('accepts valid messages', () => {
    expect(emailStepMessageSchema.safeParse(validMessage).success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const { action, ...invalid } = validMessage;
    expect(action).toBeDefined();
    expect(emailStepMessageSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects wrong version', () => {
    const invalid = { ...validMessage, version: 2 };
    expect(emailStepMessageSchema.safeParse(invalid).success).toBe(false);
  });

  it('type guard returns true for valid', () => {
    expect(isEmailStepMessage(validMessage)).toBe(true);
  });

  it('type guard returns false for invalid', () => {
    const invalid = { ...validMessage, version: 2 };
    expect(isEmailStepMessage(invalid)).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';

import { finishedStepMessageSchema, isFinishedStepMessage } from './finished-step.message';

describe('finishedStepMessageSchema', () => {
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
    action: 'conditional_split',
    conditionalSplitResult: true,
  };

  it('accepts valid messages', () => {
    expect(finishedStepMessageSchema.safeParse(validMessage).success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const { action, ...invalid } = validMessage;
    expect(action).toBeDefined();
    expect(finishedStepMessageSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects wrong version', () => {
    const invalid = { ...validMessage, version: 2 };
    expect(finishedStepMessageSchema.safeParse(invalid).success).toBe(false);
  });

  it('type guard returns true for valid', () => {
    expect(isFinishedStepMessage(validMessage)).toBe(true);
  });

  it('type guard returns false for invalid', () => {
    const invalid = { ...validMessage, version: 2 };
    expect(isFinishedStepMessage(invalid)).toBe(false);
  });
});

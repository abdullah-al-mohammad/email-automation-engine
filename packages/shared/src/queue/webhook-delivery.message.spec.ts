import { describe, it, expect } from 'vitest';
import { webhookDeliveryMessageSchema, isWebhookDeliveryMessage } from './webhook-delivery.message';

describe('webhookDeliveryMessageSchema', () => {
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
    deliveryId: '123e4567-e89b-12d3-a456-426614174007',
    url: 'https://example.com/webhook',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"test":true}',
  };

  it('accepts valid messages', () => {
    expect(webhookDeliveryMessageSchema.safeParse(validMessage).success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const { url, ...invalid } = validMessage;
    expect(url).toBeDefined();
    expect(webhookDeliveryMessageSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects wrong version', () => {
    const invalid = { ...validMessage, version: 2 };
    expect(webhookDeliveryMessageSchema.safeParse(invalid).success).toBe(false);
  });

  it('type guard returns true for valid', () => {
    expect(isWebhookDeliveryMessage(validMessage)).toBe(true);
  });

  it('type guard returns false for invalid', () => {
    const invalid = { ...validMessage, version: 2 };
    expect(isWebhookDeliveryMessage(invalid)).toBe(false);
  });
});

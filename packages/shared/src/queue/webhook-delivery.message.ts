import { z } from 'zod';
import { queueMessageEnvelopeSchema } from '../contracts/queue-message';

export const webhookDeliveryMessageSchema = queueMessageEnvelopeSchema.extend({
  contactId: z.string().uuid(),
  contactWorkflowId: z.string().uuid(),
  contactWorkflowStepId: z.string().uuid(),
  workflowId: z.string().uuid(),
  workflowStepId: z.string().uuid(),
  deliveryId: z.string().uuid(),
  url: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('POST'),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.string().optional(),
});

export type WebhookDeliveryMessage = z.infer<typeof webhookDeliveryMessageSchema>;

export function isWebhookDeliveryMessage(message: unknown): message is WebhookDeliveryMessage {
  return webhookDeliveryMessageSchema.safeParse(message).success;
}

import { z } from 'zod';

import { queueMessageEnvelopeSchema } from '../contracts/queue-message';

export const webhookStepMessageSchema = queueMessageEnvelopeSchema.extend({
  contactId: z.string().uuid(),
  contactWorkflowId: z.string().uuid(),
  contactWorkflowStepId: z.string().uuid(),
  workflowId: z.string().uuid(),
  workflowStepId: z.string().uuid(),
  action: z.literal('webhook'),
});

export type WebhookStepMessage = z.infer<typeof webhookStepMessageSchema>;

export function isWebhookStepMessage(message: unknown): message is WebhookStepMessage {
  return webhookStepMessageSchema.safeParse(message).success;
}

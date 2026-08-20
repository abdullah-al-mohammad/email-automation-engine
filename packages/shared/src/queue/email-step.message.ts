import { z } from 'zod';

import { queueMessageEnvelopeSchema } from '../contracts/queue-message';

export const emailStepMessageSchema = queueMessageEnvelopeSchema.extend({
  contactId: z.string().uuid(),
  contactWorkflowId: z.string().uuid(),
  contactWorkflowStepId: z.string().uuid(),
  workflowId: z.string().uuid(),
  workflowStepId: z.string().uuid(),
  action: z.literal('send_email'),
});

export type EmailStepMessage = z.infer<typeof emailStepMessageSchema>;

export function isEmailStepMessage(message: unknown): message is EmailStepMessage {
  return emailStepMessageSchema.safeParse(message).success;
}

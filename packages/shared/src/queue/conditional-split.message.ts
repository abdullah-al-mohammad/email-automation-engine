import { z } from 'zod';
import { queueMessageEnvelopeSchema } from '../contracts/queue-message';

export const conditionalSplitMessageSchema = queueMessageEnvelopeSchema.extend({
  contactId: z.string().uuid(),
  contactWorkflowId: z.string().uuid(),
  contactWorkflowStepId: z.string().uuid(),
  workflowId: z.string().uuid(),
  workflowStepId: z.string().uuid(),
  action: z.literal('conditional_split'),
});

export type ConditionalSplitMessage = z.infer<typeof conditionalSplitMessageSchema>;

export function isConditionalSplitMessage(message: unknown): message is ConditionalSplitMessage {
  return conditionalSplitMessageSchema.safeParse(message).success;
}

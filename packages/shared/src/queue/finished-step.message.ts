import { z } from 'zod';
import { queueMessageEnvelopeSchema } from '../contracts/queue-message';
import { SUPPORTED_STEP_ACTIONS } from '../schemas/workflow';

export const finishedStepMessageSchema = queueMessageEnvelopeSchema.extend({
  contactId: z.string().uuid(),
  contactWorkflowId: z.string().uuid(),
  contactWorkflowStepId: z.string().uuid(),
  workflowId: z.string().uuid(),
  workflowStepId: z.string().uuid(),
  action: z.enum(SUPPORTED_STEP_ACTIONS),
  conditionalSplitResult: z.boolean().optional(),
  error: z.string().optional(),
});

export type FinishedStepMessage = z.infer<typeof finishedStepMessageSchema>;

export function isFinishedStepMessage(message: unknown): message is FinishedStepMessage {
  return finishedStepMessageSchema.safeParse(message).success;
}

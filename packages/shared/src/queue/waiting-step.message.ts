import { z } from 'zod';

import { queueMessageEnvelopeSchema } from '../contracts/queue-message';
import { SUPPORTED_STEP_ACTIONS } from '../schemas/workflow';

export const waitingStepMessageSchema = queueMessageEnvelopeSchema.extend({
  contactId: z.string().uuid(),
  contactWorkflowId: z.string().uuid(),
  contactWorkflowStepId: z.string().uuid().optional(),
  workflowId: z.string().uuid(),
  workflowStepId: z.string().uuid(),
  action: z.enum(SUPPORTED_STEP_ACTIONS),
});

export type WaitingStepMessage = z.infer<typeof waitingStepMessageSchema>;

export function isWaitingStepMessage(message: unknown): message is WaitingStepMessage {
  return waitingStepMessageSchema.safeParse(message).success;
}

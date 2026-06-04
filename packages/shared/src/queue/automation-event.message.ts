import { z } from 'zod';
import { queueMessageEnvelopeSchema } from '../contracts/queue-message';
import { SUPPORTED_TRIGGER_EVENTS } from '../schemas/workflow';

export const automationEventMessageSchema = queueMessageEnvelopeSchema.extend({
  contactId: z.string().uuid(),
  event: z.enum(SUPPORTED_TRIGGER_EVENTS),
  metadata: z.record(z.string(), z.unknown()).optional(),
  occurredAt: z.string().datetime(),
  matchedTriggerIds: z.array(z.string().uuid()),
  matchedWorkflowIds: z.array(z.string().uuid()),
});

export type AutomationEventMessage = z.infer<typeof automationEventMessageSchema>;

export function isAutomationEventMessage(message: unknown): message is AutomationEventMessage {
  return automationEventMessageSchema.safeParse(message).success;
}

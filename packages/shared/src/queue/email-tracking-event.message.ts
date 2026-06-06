import { z } from 'zod';
import { queueMessageEnvelopeSchema } from '../contracts/queue-message';

export const emailTrackingEventMessageSchema = queueMessageEnvelopeSchema.extend({
  contactId: z.string().uuid(),
  emailMessageId: z.string().uuid(),
  eventType: z.enum(['delivered', 'bounced', 'complained', 'opened', 'clicked']),
  url: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  occurredAt: z.string().datetime(),
});

export type EmailTrackingEventMessage = z.infer<typeof emailTrackingEventMessageSchema>;

export function isEmailTrackingEventMessage(
  message: unknown,
): message is EmailTrackingEventMessage {
  return emailTrackingEventMessageSchema.safeParse(message).success;
}

import { z } from 'zod';

export const queueMessageEnvelopeSchema = z.object({
  version: z.literal(1),
  messageId: z.string().uuid(),
  tenantId: z.string().uuid(),
  createdAt: z.string().datetime(),
});

export type QueueMessageEnvelope = z.infer<typeof queueMessageEnvelopeSchema>;

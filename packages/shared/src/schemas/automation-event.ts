import { z } from 'zod';

import { SUPPORTED_TRIGGER_EVENTS } from './workflow';

export const AutomationEventSchema = z.object({
  tenantId: z.string().uuid(),
  contactId: z.string().uuid(),
  event: z.enum(SUPPORTED_TRIGGER_EVENTS),
  metadata: z.record(z.string(), z.unknown()).optional(),
  occurredAt: z.string().datetime(),
});

export type AutomationEventDto = z.infer<typeof AutomationEventSchema>;

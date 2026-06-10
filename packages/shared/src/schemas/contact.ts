import { z } from 'zod';

export const contactResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  email: z.string().email(),
  subscribed: z.boolean(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ContactResponse = z.infer<typeof contactResponseSchema>;

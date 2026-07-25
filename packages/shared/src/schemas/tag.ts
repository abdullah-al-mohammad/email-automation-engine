import { z } from 'zod';

export const tagResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type TagResponse = z.infer<typeof tagResponseSchema>;

export const createTagSchema = z.object({
  name: z.string().min(1).max(255),
});

export type CreateTagDto = z.infer<typeof createTagSchema>;

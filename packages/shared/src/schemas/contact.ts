import { z } from 'zod';

import { tagResponseSchema } from './tag';

export const contactResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  email: z.string().email(),
  subscribed: z.boolean(),
  metadata: z.record(z.string(), z.unknown()),
  tags: z.array(tagResponseSchema).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ContactResponse = z.infer<typeof contactResponseSchema>;

export const createContactSchema = z.object({
  email: z.string().email(),
  subscribed: z.boolean().optional().default(true),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateContactDto = z.infer<typeof createContactSchema>;

export const updateContactSchema = z.object({
  email: z.string().email().optional(),
  subscribed: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateContactDto = z.infer<typeof updateContactSchema>;

export const paginatedContactResponseSchema = z.object({
  data: z.array(contactResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export type PaginatedContactResponse = z.infer<typeof paginatedContactResponseSchema>;

export const importContactErrorSchema = z.object({
  row: z.number(),
  reason: z.string(),
});

export type ImportContactError = z.infer<typeof importContactErrorSchema>;

export const importContactsResultSchema = z.object({
  created: z.number(),
  skipped: z.number(),
  errors: z.array(importContactErrorSchema),
});

export type ImportContactsResult = z.infer<typeof importContactsResultSchema>;

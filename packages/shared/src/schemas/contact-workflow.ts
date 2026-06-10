import { z } from 'zod';

export const contactWorkflowResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  workflowId: z.string(),
  workflowTriggerId: z.string().optional().nullable(),
  contactId: z.string(),
  triggerEvent: z.string(),
  status: z.enum(['pending', 'in_progress', 'finished', 'error']),
  startedAt: z.string().datetime().optional().nullable(),
  finishedAt: z.string().datetime().optional().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ContactWorkflowResponse = z.infer<typeof contactWorkflowResponseSchema>;

export const contactWorkflowStepResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  contactWorkflowId: z.string(),
  workflowStepId: z.string(),
  status: z.enum(['pending', 'scheduled', 'finished', 'error']),
  scheduledAt: z.string().datetime().optional().nullable(),
  finishedAt: z.string().datetime().optional().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ContactWorkflowStepResponse = z.infer<typeof contactWorkflowStepResponseSchema>;

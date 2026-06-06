import { z } from 'zod';

export const SUPPORTED_STEP_ACTIONS = [
  'delay',
  'send_email',
  'attach_tag',
  'detach_tag',
  'unsubscribe_contact',
  'delete_contact',
  'conditional_split',
  'webhook',
] as const;

export const SUPPORTED_TRIGGER_EVENTS = [
  'contact.subscribed',
  'contact.unsubscribed',
  'tag.attached',
  'tag.detached',
  'email.sent',
  'email.delivered',
  'email.bounced',
  'email.complained',
  'email.opened',
  'email.link_clicked',
  'form.submitted',
  'custom.event',
] as const;

export const CreateWorkflowSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});

export type CreateWorkflowDto = z.infer<typeof CreateWorkflowSchema>;

export const UpdateWorkflowSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
});

export type UpdateWorkflowDto = z.infer<typeof UpdateWorkflowSchema>;

export const WorkflowResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  description: z.string().optional().nullable(),
  isActive: z.boolean(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  activatedAt: z.string().optional().nullable(),
});

export type WorkflowResponse = z.infer<typeof WorkflowResponseSchema>;

export const CreateWorkflowTriggerSchema = z.object({
  event: z.enum(SUPPORTED_TRIGGER_EVENTS),
  filters: z.record(z.string(), z.unknown()).optional(),
});

export type CreateWorkflowTriggerDto = z.infer<typeof CreateWorkflowTriggerSchema>;

export const UpdateWorkflowTriggerSchema = z.object({
  event: z.enum(SUPPORTED_TRIGGER_EVENTS).optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateWorkflowTriggerDto = z.infer<typeof UpdateWorkflowTriggerSchema>;

export const WorkflowTriggerResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  workflowId: z.string().uuid(),
  event: z.string(),
  filters: z.record(z.string(), z.unknown()).optional().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type WorkflowTriggerResponse = z.infer<typeof WorkflowTriggerResponseSchema>;

export const CreateWorkflowStepSchema = z.object({
  parentWorkflowStepId: z.string().uuid().optional().nullable(),
  action: z.enum(SUPPORTED_STEP_ACTIONS),
  config: z.record(z.string(), z.unknown()).optional(),
  position: z.number().int().min(0).optional(),
  trueStepId: z.string().uuid().optional().nullable(),
  falseStepId: z.string().uuid().optional().nullable(),
});

export type CreateWorkflowStepDto = z.infer<typeof CreateWorkflowStepSchema>;

export const UpdateWorkflowStepSchema = z.object({
  action: z.enum(SUPPORTED_STEP_ACTIONS).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  trueStepId: z.string().uuid().optional().nullable(),
  falseStepId: z.string().uuid().optional().nullable(),
});

export type UpdateWorkflowStepDto = z.infer<typeof UpdateWorkflowStepSchema>;

export const WorkflowStepResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  workflowId: z.string().uuid(),
  parentWorkflowStepId: z.string().uuid().optional().nullable(),
  action: z.string(),
  config: z.record(z.string(), z.unknown()).optional().nullable(),
  position: z.number().int(),
  trueStepId: z.string().uuid().optional().nullable(),
  falseStepId: z.string().uuid().optional().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type WorkflowStepResponse = z.infer<typeof WorkflowStepResponseSchema>;

export const ReorderStepsSchema = z.object({
  stepIds: z.array(z.string().uuid()),
});

export type ReorderStepsDto = z.infer<typeof ReorderStepsSchema>;

export const CreateWorkflowExitConditionSchema = z.object({
  type: z.string().min(1).max(50),
  resource: z.string().min(1).max(255),
  operator: z.string().min(1).max(50),
  value: z.string().optional().nullable(),
});

export type CreateWorkflowExitConditionDto = z.infer<typeof CreateWorkflowExitConditionSchema>;

export const UpdateWorkflowExitConditionSchema = z.object({
  type: z.string().min(1).max(50).optional(),
  resource: z.string().min(1).max(255).optional(),
  operator: z.string().min(1).max(50).optional(),
  value: z.string().optional().nullable(),
});

export type UpdateWorkflowExitConditionDto = z.infer<typeof UpdateWorkflowExitConditionSchema>;

export const WorkflowExitConditionResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  workflowId: z.string().uuid(),
  type: z.string(),
  resource: z.string(),
  operator: z.string(),
  value: z.string().optional().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type WorkflowExitConditionResponse = z.infer<typeof WorkflowExitConditionResponseSchema>;

export const EmailTemplateSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(255),
  subject: z.string().min(1).max(998),
  html: z.string().min(1),
  text: z.string().optional().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().optional().nullable(),
});

export type EmailTemplateResponse = z.infer<typeof EmailTemplateSchema>;

export const CreateEmailTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  subject: z.string().min(1).max(998),
  html: z.string().min(1),
  text: z.string().optional().nullable(),
});

export type CreateEmailTemplateDto = z.infer<typeof CreateEmailTemplateSchema>;

export const UpdateEmailTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  subject: z.string().min(1).max(998).optional(),
  html: z.string().min(1).optional(),
  text: z.string().optional().nullable(),
});

export type UpdateEmailTemplateDto = z.infer<typeof UpdateEmailTemplateSchema>;

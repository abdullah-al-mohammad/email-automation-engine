import type { ContactWorkflowStep } from '../aggregates/contact-workflow-step.aggregate';

export interface ContactWorkflowStepRepository {
  findById(id: string): Promise<ContactWorkflowStep | null>;
  findUnfinishedStep(
    contactWorkflowId: string,
    workflowStepId: string,
  ): Promise<ContactWorkflowStep | null>;
  save(contactWorkflowStep: ContactWorkflowStep): Promise<ContactWorkflowStep>;
  findDueSteps(now: Date): Promise<ContactWorkflowStep[]>;
  findAllByContactWorkflowId(
    tenantId: string,
    contactWorkflowId: string,
  ): Promise<ContactWorkflowStep[]>;
}

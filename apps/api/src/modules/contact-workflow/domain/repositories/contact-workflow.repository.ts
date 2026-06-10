import type { ContactWorkflow } from '../aggregates/contact-workflow.aggregate';

export interface ContactWorkflowRepository {
  findById(id: string): Promise<ContactWorkflow | null>;
  findActiveByContactAndWorkflow(
    contactId: string,
    workflowId: string,
  ): Promise<ContactWorkflow | null>;
  findManyByWorkflowId(workflowId: string): Promise<ContactWorkflow[]>;
  save(contactWorkflow: ContactWorkflow): Promise<ContactWorkflow>;
}

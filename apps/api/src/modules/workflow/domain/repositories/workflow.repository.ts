import { type Workflow } from '../aggregates/workflow.aggregate';

export interface WorkflowRepository {
  findById(id: string): Promise<Workflow | null>;
  findByTenantId(tenantId: string): Promise<Workflow[]>;
  save(workflow: Workflow): Promise<Workflow>;
  delete(id: string): Promise<void>;
}

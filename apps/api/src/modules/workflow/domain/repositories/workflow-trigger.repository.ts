import { type WorkflowTrigger } from '../aggregates/workflow-trigger.aggregate';

export interface WorkflowTriggerRepository {
  findByWorkflowId(workflowId: string): Promise<WorkflowTrigger[]>;
  save(trigger: WorkflowTrigger): Promise<WorkflowTrigger>;
  delete(id: string): Promise<void>;
}

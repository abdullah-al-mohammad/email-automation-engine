import { type WorkflowStep } from '../aggregates/workflow-step.aggregate';

export interface WorkflowStepRepository {
  findByWorkflowId(workflowId: string): Promise<WorkflowStep[]>;
  save(step: WorkflowStep): Promise<WorkflowStep>;
  delete(id: string): Promise<void>;
}

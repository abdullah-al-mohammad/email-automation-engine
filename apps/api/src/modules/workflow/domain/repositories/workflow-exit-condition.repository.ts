import { type WorkflowExitCondition } from '../aggregates/workflow-exit-condition.aggregate';

export interface WorkflowExitConditionRepository {
  findByWorkflowId(workflowId: string): Promise<WorkflowExitCondition[]>;
  save(condition: WorkflowExitCondition): Promise<WorkflowExitCondition>;
  save(conditions: WorkflowExitCondition[]): Promise<WorkflowExitCondition[]>;
  delete(id: string): Promise<void>;
  deleteByWorkflowId(workflowId: string): Promise<void>;
}

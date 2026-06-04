import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowExitCondition } from '../../domain/aggregates/workflow-exit-condition.aggregate';
import { type WorkflowExitConditionRepository } from '../../domain/repositories/workflow-exit-condition.repository';

@Injectable()
export class TypeOrmWorkflowExitConditionRepository implements WorkflowExitConditionRepository {
  constructor(
    @InjectRepository(WorkflowExitCondition)
    private readonly repo: Repository<WorkflowExitCondition>,
  ) {}

  async findByWorkflowId(workflowId: string): Promise<WorkflowExitCondition[]> {
    return this.repo.find({ where: { workflowId } });
  }

  save(condition: WorkflowExitCondition): Promise<WorkflowExitCondition>;
  save(conditions: WorkflowExitCondition[]): Promise<WorkflowExitCondition[]>;
  async save(
    conditionOrConditions: WorkflowExitCondition | WorkflowExitCondition[],
  ): Promise<WorkflowExitCondition | WorkflowExitCondition[]> {
    if (Array.isArray(conditionOrConditions)) {
      return this.repo.save(conditionOrConditions);
    }
    return this.repo.save(conditionOrConditions);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async deleteByWorkflowId(workflowId: string): Promise<void> {
    await this.repo.delete({ workflowId });
  }
}

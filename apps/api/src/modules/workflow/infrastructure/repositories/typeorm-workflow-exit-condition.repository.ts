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

  async save(condition: WorkflowExitCondition): Promise<WorkflowExitCondition> {
    return this.repo.save(condition);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async deleteByWorkflowId(workflowId: string): Promise<void> {
    await this.repo.delete({ workflowId });
  }
}

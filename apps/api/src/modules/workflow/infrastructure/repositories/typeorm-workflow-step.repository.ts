import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowStep } from '../../domain/aggregates/workflow-step.aggregate';
import { type WorkflowStepRepository } from '../../domain/repositories/workflow-step.repository';

@Injectable()
export class TypeOrmWorkflowStepRepository implements WorkflowStepRepository {
  constructor(
    @InjectRepository(WorkflowStep)
    private readonly repo: Repository<WorkflowStep>,
  ) {}

  async findByWorkflowId(workflowId: string): Promise<WorkflowStep[]> {
    return this.repo.find({ where: { workflowId }, order: { position: 'ASC' } });
  }

  async save(step: WorkflowStep): Promise<WorkflowStep> {
    return this.repo.save(step);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowTrigger } from '../../domain/aggregates/workflow-trigger.aggregate';
import { type WorkflowTriggerRepository } from '../../domain/repositories/workflow-trigger.repository';

@Injectable()
export class TypeOrmWorkflowTriggerRepository implements WorkflowTriggerRepository {
  constructor(
    @InjectRepository(WorkflowTrigger)
    private readonly repo: Repository<WorkflowTrigger>,
  ) {}

  async findByWorkflowId(workflowId: string): Promise<WorkflowTrigger[]> {
    return this.repo.find({ where: { workflowId } });
  }

  async save(trigger: WorkflowTrigger): Promise<WorkflowTrigger> {
    return this.repo.save(trigger);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}

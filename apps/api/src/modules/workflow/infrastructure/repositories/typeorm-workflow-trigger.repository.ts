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

  async findActiveByEvent(tenantId: string, event: string): Promise<WorkflowTrigger[]> {
    return this.repo
      .createQueryBuilder('trigger')
      .innerJoinAndSelect('trigger.workflow', 'workflow')
      .where('trigger.tenant_id = :tenantId', { tenantId })
      .andWhere('trigger.event = :event', { event })
      .andWhere('workflow.is_active = true')
      .getMany();
  }

  async save(trigger: WorkflowTrigger): Promise<WorkflowTrigger> {
    return this.repo.save(trigger);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}

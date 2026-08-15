import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Workflow } from '../../domain/aggregates/workflow.aggregate';
import { type WorkflowRepository } from '../../domain/repositories/workflow.repository';

@Injectable()
export class TypeOrmWorkflowRepository implements WorkflowRepository {
  constructor(
    @InjectRepository(Workflow)
    private readonly repo: Repository<Workflow>,
  ) {}

  async findById(id: string): Promise<Workflow | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByTenantId(tenantId: string): Promise<Workflow[]> {
    return this.repo.find({ where: { tenantId } });
  }

  async save(workflow: Workflow): Promise<Workflow> {
    return this.repo.save(workflow);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { ContactWorkflow } from '../../domain/aggregates/contact-workflow.aggregate';
import { ContactWorkflowRepository } from '../../domain/repositories/contact-workflow.repository';

@Injectable()
export class TypeOrmContactWorkflowRepository implements ContactWorkflowRepository {
  constructor(
    @InjectRepository(ContactWorkflow)
    private readonly repository: Repository<ContactWorkflow>,
  ) {}

  async findById(id: string): Promise<ContactWorkflow | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findActiveByContactAndWorkflow(
    contactId: string,
    workflowId: string,
  ): Promise<ContactWorkflow | null> {
    return this.repository.findOne({
      where: {
        contactId,
        workflowId,
        status: Not(In(['finished', 'error'])),
      },
    });
  }

  async findManyByWorkflowId(tenantId: string, workflowId: string): Promise<ContactWorkflow[]> {
    return this.repository.find({
      where: { tenantId, workflowId },
      order: { createdAt: 'DESC' },
    });
  }

  async save(contactWorkflow: ContactWorkflow): Promise<ContactWorkflow> {
    return this.repository.save(contactWorkflow);
  }
}

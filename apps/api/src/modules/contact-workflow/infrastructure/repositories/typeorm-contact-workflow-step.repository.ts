import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, LessThanOrEqual } from 'typeorm';
import { ContactWorkflowStep } from '../../domain/aggregates/contact-workflow-step.aggregate';
import { ContactWorkflowStepRepository } from '../../domain/repositories/contact-workflow-step.repository';

@Injectable()
export class TypeOrmContactWorkflowStepRepository implements ContactWorkflowStepRepository {
  constructor(
    @InjectRepository(ContactWorkflowStep)
    private readonly repository: Repository<ContactWorkflowStep>,
  ) {}

  async findById(id: string): Promise<ContactWorkflowStep | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findUnfinishedStep(
    contactWorkflowId: string,
    workflowStepId: string,
  ): Promise<ContactWorkflowStep | null> {
    return this.repository.findOne({
      where: {
        contactWorkflowId,
        workflowStepId,
        status: Not('finished'),
      },
    });
  }

  async save(contactWorkflowStep: ContactWorkflowStep): Promise<ContactWorkflowStep> {
    return this.repository.save(contactWorkflowStep);
  }

  async findDueSteps(now: Date): Promise<ContactWorkflowStep[]> {
    return this.repository.find({
      where: {
        status: 'scheduled',
        scheduledAt: LessThanOrEqual(now),
      },
    });
  }

  async findAllByContactWorkflowId(contactWorkflowId: string): Promise<ContactWorkflowStep[]> {
    return this.repository.find({
      where: { contactWorkflowId },
      order: { createdAt: 'ASC' },
    });
  }
}

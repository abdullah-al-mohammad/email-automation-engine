import { Injectable, Inject } from '@nestjs/common';
import {
  CONTACT_WORKFLOW_REPOSITORY,
  CONTACT_WORKFLOW_STEP_REPOSITORY,
} from '../../constants/tokens';
import { ContactWorkflowRepository } from '../../domain/repositories/contact-workflow.repository';
import { ContactWorkflowStepRepository } from '../../domain/repositories/contact-workflow-step.repository';
import { ContactWorkflow } from '../../domain/aggregates/contact-workflow.aggregate';
import { ContactWorkflowStep } from '../../domain/aggregates/contact-workflow-step.aggregate';
import {
  type ContactWorkflowResponse,
  type ContactWorkflowStepResponse,
} from '@email-automation-engine/shared';

@Injectable()
export class ContactWorkflowService {
  constructor(
    @Inject(CONTACT_WORKFLOW_REPOSITORY)
    private readonly contactWorkflowRepository: ContactWorkflowRepository,
    @Inject(CONTACT_WORKFLOW_STEP_REPOSITORY)
    private readonly contactWorkflowStepRepository: ContactWorkflowStepRepository,
  ) {}

  async createContactWorkflow(
    tenantId: string,
    workflowId: string,
    workflowTriggerId: string | undefined,
    contactId: string,
    triggerEvent: string,
  ): Promise<ContactWorkflow> {
    const contactWorkflow = new ContactWorkflow();
    contactWorkflow.tenantId = tenantId;
    contactWorkflow.workflowId = workflowId;
    contactWorkflow.workflowTriggerId = workflowTriggerId;
    contactWorkflow.contactId = contactId;
    contactWorkflow.triggerEvent = triggerEvent;
    return this.contactWorkflowRepository.save(contactWorkflow);
  }

  async findActiveByContactAndWorkflow(
    contactId: string,
    workflowId: string,
  ): Promise<ContactWorkflow | null> {
    return this.contactWorkflowRepository.findActiveByContactAndWorkflow(contactId, workflowId);
  }

  async findManyByWorkflowId(workflowId: string): Promise<ContactWorkflowResponse[]> {
    const records = await this.contactWorkflowRepository.findManyByWorkflowId(workflowId);
    return records.map((r) => ({
      id: r.id,
      tenantId: r.tenantId,
      workflowId: r.workflowId,
      workflowTriggerId: r.workflowTriggerId,
      contactId: r.contactId,
      triggerEvent: r.triggerEvent,
      status: r.status as ContactWorkflowResponse['status'],
      startedAt: r.startedAt?.toISOString(),
      finishedAt: r.finishedAt?.toISOString(),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async markInProgress(id: string): Promise<ContactWorkflow | null> {
    const contactWorkflow = await this.contactWorkflowRepository.findById(id);
    if (!contactWorkflow) return null;
    contactWorkflow.status = 'in_progress';
    if (!contactWorkflow.startedAt) {
      contactWorkflow.startedAt = new Date();
    }
    return this.contactWorkflowRepository.save(contactWorkflow);
  }

  async markFinished(id: string): Promise<ContactWorkflow | null> {
    const contactWorkflow = await this.contactWorkflowRepository.findById(id);
    if (!contactWorkflow) return null;
    contactWorkflow.status = 'finished';
    contactWorkflow.finishedAt = new Date();
    return this.contactWorkflowRepository.save(contactWorkflow);
  }

  async createOrFindUnfinishedStep(
    tenantId: string,
    contactWorkflowId: string,
    workflowStepId: string,
  ): Promise<ContactWorkflowStep> {
    let step = await this.contactWorkflowStepRepository.findUnfinishedStep(
      contactWorkflowId,
      workflowStepId,
    );
    if (!step) {
      step = new ContactWorkflowStep();
      step.tenantId = tenantId;
      step.contactWorkflowId = contactWorkflowId;
      step.workflowStepId = workflowStepId;
      step = await this.contactWorkflowStepRepository.save(step);
    }
    return step;
  }

  async markStepFinished(stepId: string): Promise<ContactWorkflowStep | null> {
    const step = await this.contactWorkflowStepRepository.findById(stepId);
    if (!step) return null;
    step.status = 'finished';
    step.finishedAt = new Date();
    return this.contactWorkflowStepRepository.save(step);
  }

  async markStepScheduled(stepId: string, scheduledAt: Date): Promise<ContactWorkflowStep | null> {
    const step = await this.contactWorkflowStepRepository.findById(stepId);
    if (!step) return null;
    step.status = 'scheduled';
    step.scheduledAt = scheduledAt;
    return this.contactWorkflowStepRepository.save(step);
  }

  async findDueSteps(now: Date): Promise<ContactWorkflowStep[]> {
    return this.contactWorkflowStepRepository.findDueSteps(now);
  }

  async findAllStepsByContactWorkflowId(
    contactWorkflowId: string,
  ): Promise<ContactWorkflowStepResponse[]> {
    const steps =
      await this.contactWorkflowStepRepository.findAllByContactWorkflowId(contactWorkflowId);
    return steps.map((s) => ({
      id: s.id,
      tenantId: s.tenantId,
      contactWorkflowId: s.contactWorkflowId,
      workflowStepId: s.workflowStepId,
      status: s.status as ContactWorkflowStepResponse['status'],
      scheduledAt: s.scheduledAt?.toISOString(),
      finishedAt: s.finishedAt?.toISOString(),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  }
}

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  type CreateWorkflowTriggerDto,
  type UpdateWorkflowTriggerDto,
  type WorkflowTriggerResponse,
} from '@email-automation-engine/shared';
import { WORKFLOW_TRIGGER_REPOSITORY } from '../../constants/tokens';
import { type WorkflowTriggerRepository } from '../../domain/repositories/workflow-trigger.repository';
import { WorkflowTrigger } from '../../domain/aggregates/workflow-trigger.aggregate';
import { WorkflowService } from './workflow.service';

@Injectable()
export class WorkflowTriggerService {
  constructor(
    @Inject(WORKFLOW_TRIGGER_REPOSITORY)
    private readonly triggerRepo: WorkflowTriggerRepository,
    private readonly workflowService: WorkflowService,
  ) {}

  async getTriggers(tenantId: string, workflowId: string): Promise<WorkflowTriggerResponse[]> {
    await this.workflowService.findById(tenantId, workflowId);
    const triggers = await this.triggerRepo.findByWorkflowId(workflowId);
    return triggers.map((t) => this.mapTriggerToResponse(t));
  }

  async addTrigger(
    tenantId: string,
    workflowId: string,
    dto: CreateWorkflowTriggerDto,
  ): Promise<WorkflowTriggerResponse> {
    await this.workflowService.verifyWorkflowInactive(tenantId, workflowId);

    const trigger = new WorkflowTrigger();
    trigger.tenantId = tenantId;
    trigger.workflowId = workflowId;
    trigger.event = dto.event;
    trigger.filters = dto.filters;
    const saved = await this.triggerRepo.save(trigger);
    return this.mapTriggerToResponse(saved);
  }

  async updateTrigger(
    tenantId: string,
    workflowId: string,
    triggerId: string,
    dto: UpdateWorkflowTriggerDto,
  ): Promise<WorkflowTriggerResponse> {
    await this.workflowService.verifyWorkflowInactive(tenantId, workflowId);

    const triggers = await this.triggerRepo.findByWorkflowId(workflowId);
    const trigger = triggers.find((t) => t.id === triggerId);
    if (!trigger) {
      throw new NotFoundException('Trigger not found');
    }

    if (dto.event !== undefined) trigger.event = dto.event;
    if (dto.filters !== undefined) trigger.filters = dto.filters;

    const saved = await this.triggerRepo.save(trigger);
    return this.mapTriggerToResponse(saved);
  }

  async deleteTrigger(tenantId: string, workflowId: string, triggerId: string): Promise<void> {
    await this.workflowService.verifyWorkflowInactive(tenantId, workflowId);

    const triggers = await this.triggerRepo.findByWorkflowId(workflowId);
    if (!triggers.some((t) => t.id === triggerId)) {
      throw new NotFoundException('Trigger not found');
    }

    await this.triggerRepo.delete(triggerId);
  }

  private mapTriggerToResponse(trigger: WorkflowTrigger): WorkflowTriggerResponse {
    return {
      id: trigger.id,
      tenantId: trigger.tenantId,
      workflowId: trigger.workflowId,
      event: trigger.event,
      filters: trigger.filters ?? undefined,
      createdAt: trigger.createdAt.toISOString(),
      updatedAt: trigger.updatedAt.toISOString(),
    };
  }
}

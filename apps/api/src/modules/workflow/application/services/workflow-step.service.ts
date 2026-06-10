import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  type CreateWorkflowStepDto,
  type UpdateWorkflowStepDto,
  type WorkflowStepResponse,
  type ReorderStepsDto,
} from '@email-automation-engine/shared';
import { WORKFLOW_STEP_REPOSITORY } from '../../constants/tokens';
import { type WorkflowStepRepository } from '../../domain/repositories/workflow-step.repository';
import { WorkflowStep } from '../../domain/aggregates/workflow-step.aggregate';
import { WorkflowService } from './workflow.service';

@Injectable()
export class WorkflowStepService {
  constructor(
    @Inject(WORKFLOW_STEP_REPOSITORY)
    private readonly stepRepo: WorkflowStepRepository,
    private readonly dataSource: DataSource,
    private readonly workflowService: WorkflowService,
  ) {}

  async addStep(
    tenantId: string,
    workflowId: string,
    dto: CreateWorkflowStepDto,
  ): Promise<WorkflowStepResponse> {
    await this.workflowService.verifyWorkflowInactive(tenantId, workflowId);

    if (dto.parentWorkflowStepId || dto.trueStepId || dto.falseStepId) {
      const steps = await this.stepRepo.findByWorkflowId(workflowId);
      if (dto.parentWorkflowStepId && !steps.some((s) => s.id === dto.parentWorkflowStepId)) {
        throw new BadRequestException('Parent step must belong to the same workflow');
      }
      if (dto.trueStepId && !steps.some((s) => s.id === dto.trueStepId)) {
        throw new BadRequestException('True step must belong to the same workflow');
      }
      if (dto.falseStepId && !steps.some((s) => s.id === dto.falseStepId)) {
        throw new BadRequestException('False step must belong to the same workflow');
      }
    }

    const step = new WorkflowStep();
    step.tenantId = tenantId;
    step.workflowId = workflowId;
    step.action = dto.action;
    step.config = dto.config;
    step.position = dto.position ?? 0;
    if (dto.parentWorkflowStepId) {
      step.parentWorkflowStepId = dto.parentWorkflowStepId;
    }
    if (dto.trueStepId) {
      step.trueStepId = dto.trueStepId;
    }
    if (dto.falseStepId) {
      step.falseStepId = dto.falseStepId;
    }
    const saved = await this.stepRepo.save(step);
    return this.mapStepToResponse(saved);
  }

  async updateStep(
    tenantId: string,
    workflowId: string,
    stepId: string,
    dto: UpdateWorkflowStepDto,
  ): Promise<WorkflowStepResponse> {
    await this.workflowService.verifyWorkflowInactive(tenantId, workflowId);

    const steps = await this.stepRepo.findByWorkflowId(workflowId);
    const step = steps.find((s) => s.id === stepId);
    if (!step) {
      throw new NotFoundException('Step not found');
    }

    if (dto.action !== undefined) step.action = dto.action;
    if (dto.config !== undefined) step.config = dto.config;
    if (dto.trueStepId !== undefined) {
      if (dto.trueStepId && !steps.some((s) => s.id === dto.trueStepId)) {
        throw new BadRequestException('True step must belong to the same workflow');
      }
      step.trueStepId = dto.trueStepId ?? undefined;
    }
    if (dto.falseStepId !== undefined) {
      if (dto.falseStepId && !steps.some((s) => s.id === dto.falseStepId)) {
        throw new BadRequestException('False step must belong to the same workflow');
      }
      step.falseStepId = dto.falseStepId ?? undefined;
    }

    const saved = await this.stepRepo.save(step);
    return this.mapStepToResponse(saved);
  }

  async deleteStep(tenantId: string, workflowId: string, stepId: string): Promise<void> {
    await this.workflowService.verifyWorkflowInactive(tenantId, workflowId);

    const steps = await this.stepRepo.findByWorkflowId(workflowId);
    if (!steps.some((s) => s.id === stepId)) {
      throw new NotFoundException('Step not found');
    }

    await this.stepRepo.delete(stepId);
  }

  async reorderSteps(tenantId: string, workflowId: string, dto: ReorderStepsDto): Promise<void> {
    await this.workflowService.verifyWorkflowInactive(tenantId, workflowId);

    const steps = await this.stepRepo.findByWorkflowId(workflowId);
    const stepIds = new Set(steps.map((s) => s.id));

    if (dto.stepIds.length !== stepIds.size) {
      throw new BadRequestException('Reorder list must contain all workflow steps exactly once');
    }

    const uniqueIds = new Set(dto.stepIds);
    if (uniqueIds.size !== dto.stepIds.length) {
      throw new BadRequestException('Reorder list must not contain duplicate step IDs');
    }

    for (const id of dto.stepIds) {
      if (!stepIds.has(id)) {
        throw new BadRequestException(`Step ${id} does not belong to this workflow`);
      }
    }

    const execute = async (saveFn: (step: WorkflowStep) => Promise<WorkflowStep>) => {
      for (let i = 0; i < dto.stepIds.length; i++) {
        const step = steps.find((s) => s.id === dto.stepIds[i]);
        if (step) {
          step.position = i;
          await saveFn(step);
        }
      }
    };

    if (this.dataSource) {
      await this.dataSource.transaction(async (manager) => {
        await execute((step) => manager.save(step));
      });
    } else {
      await execute((step) => this.stepRepo.save(step));
    }
  }

  async findStep(
    tenantId: string,
    workflowId: string,
    stepId: string,
  ): Promise<WorkflowStepResponse> {
    await this.workflowService.getWorkflowOrThrow(tenantId, workflowId);
    const steps = await this.stepRepo.findByWorkflowId(workflowId);
    const step = steps.find((s) => s.id === stepId);
    if (!step) {
      throw new NotFoundException('Step not found');
    }
    return this.mapStepToResponse(step);
  }

  private mapStepToResponse(step: WorkflowStep): WorkflowStepResponse {
    return {
      id: step.id,
      tenantId: step.tenantId,
      workflowId: step.workflowId,
      parentWorkflowStepId: step.parentWorkflowStepId ?? undefined,
      action: step.action,
      config: step.config ?? undefined,
      position: step.position,
      trueStepId: step.trueStepId ?? undefined,
      falseStepId: step.falseStepId ?? undefined,
      createdAt: step.createdAt.toISOString(),
      updatedAt: step.updatedAt.toISOString(),
    };
  }
}

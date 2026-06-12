import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  type CreateWorkflowStepDto,
  type UpdateWorkflowStepDto,
  type WorkflowStepResponse,
  type ReorderStepsDto,
  STEP_ACTIONS,
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

  private validateDelayConfig(config: Record<string, unknown> | undefined) {
    if (!config) return;
    const { unit, amount } = config as {
      unit?: string;
      amount?: string | number;
    };
    if (unit === 'minutes') {
      const val = Number(amount);
      if (isNaN(val) || val < 15) {
        throw new BadRequestException('Minimum delay for minutes is 15');
      }
      if (val % 15 !== 0) {
        throw new BadRequestException('Delay in minutes must be a multiple of 15');
      }
    } else if (unit) {
      const val = Number(amount);
      if (isNaN(val) || val < 1) {
        throw new BadRequestException('Minimum delay is 1');
      }
    }
  }

  async getSteps(tenantId: string, workflowId: string): Promise<WorkflowStepResponse[]> {
    await this.workflowService.findById(tenantId, workflowId);
    const steps = await this.stepRepo.findByWorkflowId(workflowId);
    return steps.map((s) => this.mapStepToResponse(s));
  }

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

    if (dto.action === STEP_ACTIONS.DELAY) {
      this.validateDelayConfig(dto.config);
    }

    const step = new WorkflowStep();
    step.tenantId = tenantId;
    step.workflowId = workflowId;
    step.action = dto.action;
    step.config = dto.config;
    step.position = dto.position ?? 0;
    step.parentWorkflowStepId = dto.parentWorkflowStepId ?? null;
    step.trueStepId = dto.trueStepId ?? null;
    step.falseStepId = dto.falseStepId ?? null;
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

    const actionToSave = dto.action !== undefined ? dto.action : step.action;
    const configToSave = dto.config !== undefined ? dto.config : step.config;

    if (actionToSave === STEP_ACTIONS.DELAY && dto.config !== undefined) {
      this.validateDelayConfig(configToSave);
    }

    if (dto.action !== undefined) step.action = dto.action;
    if (dto.config !== undefined) step.config = dto.config;
    if (dto.parentWorkflowStepId !== undefined) {
      if (dto.parentWorkflowStepId && !steps.some((s) => s.id === dto.parentWorkflowStepId)) {
        throw new BadRequestException('Parent step must belong to the same workflow');
      }
      step.parentWorkflowStepId = dto.parentWorkflowStepId ?? null;
    }
    if (dto.trueStepId !== undefined) {
      if (dto.trueStepId && !steps.some((s) => s.id === dto.trueStepId)) {
        throw new BadRequestException('True step must belong to the same workflow');
      }
      step.trueStepId = dto.trueStepId ?? null;
    }
    if (dto.falseStepId !== undefined) {
      if (dto.falseStepId && !steps.some((s) => s.id === dto.falseStepId)) {
        throw new BadRequestException('False step must belong to the same workflow');
      }
      step.falseStepId = dto.falseStepId ?? null;
    }

    const saved = await this.stepRepo.save(step);
    return this.mapStepToResponse(saved);
  }

  async deleteStep(tenantId: string, workflowId: string, stepId: string): Promise<void> {
    await this.workflowService.verifyWorkflowInactive(tenantId, workflowId);

    const steps = await this.stepRepo.findByWorkflowId(workflowId);
    const stepToDelete = steps.find((s) => s.id === stepId);
    if (!stepToDelete) {
      throw new NotFoundException('Step not found');
    }

    // 1. Find linear child
    const linearChild = steps.find((s) => s.parentWorkflowStepId === stepId);

    // 2. Determine replacement ID
    const replacementId =
      linearChild?.id || stepToDelete.trueStepId || stepToDelete.falseStepId || null;

    // 3. Update linear child's parent reference
    if (linearChild) {
      linearChild.parentWorkflowStepId = stepToDelete.parentWorkflowStepId;
      await this.stepRepo.save(linearChild);
    } else {
      // If no linear child, but we have a conditional child being promoted,
      // update its parentWorkflowStepId to the deleted step's linear parent
      if (replacementId) {
        const promotedChild = steps.find((s) => s.id === replacementId);
        if (promotedChild) {
          promotedChild.parentWorkflowStepId = stepToDelete.parentWorkflowStepId;
          await this.stepRepo.save(promotedChild);
        }
      }
    }

    // 4. Update conditional parents
    const conditionalParents = steps.filter(
      (s) => s.trueStepId === stepId || s.falseStepId === stepId,
    );

    for (const parent of conditionalParents) {
      if (parent.trueStepId === stepId) {
        parent.trueStepId = replacementId;
      }
      if (parent.falseStepId === stepId) {
        parent.falseStepId = replacementId;
      }
      await this.stepRepo.save(parent);
    }

    // 5. Delete the step
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
      parentWorkflowStepId: step.parentWorkflowStepId ?? null,
      action: step.action,
      config: step.config ?? undefined,
      position: step.position,
      trueStepId: step.trueStepId ?? null,
      falseStepId: step.falseStepId ?? null,
      createdAt: step.createdAt.toISOString(),
      updatedAt: step.updatedAt.toISOString(),
    };
  }
}

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { lookup } from 'node:dns/promises';
import {
  CACHE_SERVICE,
  type ICacheService,
} from '../../../../infrastructure/cache/cache.interface';
import {
  type CreateWorkflowDto,
  type UpdateWorkflowDto,
  type WorkflowResponse,
  type CreateWorkflowTriggerDto,
  type UpdateWorkflowTriggerDto,
  type WorkflowTriggerResponse,
  type CreateWorkflowStepDto,
  type UpdateWorkflowStepDto,
  type WorkflowStepResponse,
  type ReorderStepsDto,
  type CreateWorkflowExitConditionDto,
  type UpdateWorkflowExitConditionDto,
  type WorkflowExitConditionResponse,
} from '@email-automation-engine/shared';
import {
  WORKFLOW_REPOSITORY,
  WORKFLOW_TRIGGER_REPOSITORY,
  WORKFLOW_STEP_REPOSITORY,
  WORKFLOW_EXIT_CONDITION_REPOSITORY,
} from '../../constants/tokens';
import { type WorkflowRepository } from '../../domain/repositories/workflow.repository';
import { type WorkflowTriggerRepository } from '../../domain/repositories/workflow-trigger.repository';
import { type WorkflowStepRepository } from '../../domain/repositories/workflow-step.repository';
import { type WorkflowExitConditionRepository } from '../../domain/repositories/workflow-exit-condition.repository';
import { Workflow } from '../../domain/aggregates/workflow.aggregate';
import { WorkflowTrigger } from '../../domain/aggregates/workflow-trigger.aggregate';
import { WorkflowStep } from '../../domain/aggregates/workflow-step.aggregate';
import { WorkflowExitCondition } from '../../domain/aggregates/workflow-exit-condition.aggregate';
import { TriggerCacheService } from '../../../automation-event/application/services/trigger-cache.service';

@Injectable()
export class WorkflowService {
  constructor(
    @Inject(WORKFLOW_REPOSITORY)
    private readonly workflowRepo: WorkflowRepository,
    @Inject(WORKFLOW_TRIGGER_REPOSITORY)
    private readonly triggerRepo: WorkflowTriggerRepository,
    @Inject(WORKFLOW_STEP_REPOSITORY)
    private readonly stepRepo: WorkflowStepRepository,
    @Inject(WORKFLOW_EXIT_CONDITION_REPOSITORY)
    private readonly exitConditionRepo: WorkflowExitConditionRepository,
    private readonly dataSource: DataSource,
    @Optional()
    @Inject(CACHE_SERVICE)
    private readonly cacheService?: ICacheService,
  ) {}

  async create(tenantId: string, dto: CreateWorkflowDto): Promise<WorkflowResponse> {
    const workflow = new Workflow();
    workflow.tenantId = tenantId;
    workflow.name = dto.name;
    workflow.description = dto.description;

    const saved = await this.workflowRepo.save(workflow);
    return this.mapWorkflowToResponse(saved);
  }

  async findByTenantId(tenantId: string): Promise<WorkflowResponse[]> {
    const workflows = await this.workflowRepo.findByTenantId(tenantId);
    return workflows.map((w) => this.mapWorkflowToResponse(w));
  }

  async findById(tenantId: string, workflowId: string): Promise<WorkflowResponse> {
    const workflow = await this.getWorkflowOrThrow(tenantId, workflowId);
    return this.mapWorkflowToResponse(workflow);
  }

  async update(
    tenantId: string,
    workflowId: string,
    dto: UpdateWorkflowDto,
  ): Promise<WorkflowResponse> {
    const workflow = await this.getWorkflowOrThrow(tenantId, workflowId);

    if (dto.name !== undefined) workflow.name = dto.name;
    if (dto.description !== undefined) workflow.description = dto.description;

    const saved = await this.workflowRepo.save(workflow);
    return this.mapWorkflowToResponse(saved);
  }

  async activate(tenantId: string, workflowId: string): Promise<WorkflowResponse> {
    const workflow = await this.getWorkflowOrThrow(tenantId, workflowId);
    if (workflow.isActive) {
      return this.mapWorkflowToResponse(workflow);
    }

    await this.validateForActivation(workflowId);
    workflow.activatedAt = new Date();
    workflow.status = 'active';
    workflow.isActive = true;

    const saved = await this.workflowRepo.save(workflow);
    await this.invalidateTriggerCache(tenantId, workflowId);
    return this.mapWorkflowToResponse(saved);
  }

  async deactivate(tenantId: string, workflowId: string): Promise<WorkflowResponse> {
    const workflow = await this.getWorkflowOrThrow(tenantId, workflowId);
    if (!workflow.isActive) {
      return this.mapWorkflowToResponse(workflow);
    }

    workflow.status = 'paused';
    workflow.isActive = false;

    const saved = await this.workflowRepo.save(workflow);
    await this.invalidateTriggerCache(tenantId, workflowId);
    return this.mapWorkflowToResponse(saved);
  }

  async delete(tenantId: string, workflowId: string): Promise<void> {
    const workflow = await this.getWorkflowOrThrow(tenantId, workflowId);
    if (workflow.isActive) {
      throw new BadRequestException('Cannot delete an active workflow');
    }
    await this.workflowRepo.delete(workflowId);
  }

  async addTrigger(
    tenantId: string,
    workflowId: string,
    dto: CreateWorkflowTriggerDto,
  ): Promise<WorkflowTriggerResponse> {
    await this.verifyWorkflowInactive(tenantId, workflowId);

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
    await this.verifyWorkflowInactive(tenantId, workflowId);

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
    await this.verifyWorkflowInactive(tenantId, workflowId);

    const triggers = await this.triggerRepo.findByWorkflowId(workflowId);
    if (!triggers.some((t) => t.id === triggerId)) {
      throw new NotFoundException('Trigger not found');
    }

    await this.triggerRepo.delete(triggerId);
  }

  async addStep(
    tenantId: string,
    workflowId: string,
    dto: CreateWorkflowStepDto,
  ): Promise<WorkflowStepResponse> {
    await this.verifyWorkflowInactive(tenantId, workflowId);

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
    await this.verifyWorkflowInactive(tenantId, workflowId);

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
    await this.verifyWorkflowInactive(tenantId, workflowId);

    const steps = await this.stepRepo.findByWorkflowId(workflowId);
    if (!steps.some((s) => s.id === stepId)) {
      throw new NotFoundException('Step not found');
    }

    await this.stepRepo.delete(stepId);
  }

  async reorderSteps(tenantId: string, workflowId: string, dto: ReorderStepsDto): Promise<void> {
    await this.verifyWorkflowInactive(tenantId, workflowId);

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

  async addExitCondition(
    tenantId: string,
    workflowId: string,
    dto: CreateWorkflowExitConditionDto,
  ): Promise<WorkflowExitConditionResponse> {
    await this.verifyWorkflowInactive(tenantId, workflowId);

    const condition = new WorkflowExitCondition();
    condition.tenantId = tenantId;
    condition.workflowId = workflowId;
    condition.type = dto.type;
    condition.resource = dto.resource;
    condition.operator = dto.operator;
    condition.value = dto.value ?? null;
    const saved = await this.exitConditionRepo.save(condition);
    return this.mapExitConditionToResponse(saved);
  }

  async updateExitCondition(
    tenantId: string,
    workflowId: string,
    conditionId: string,
    dto: UpdateWorkflowExitConditionDto,
  ): Promise<WorkflowExitConditionResponse> {
    await this.verifyWorkflowInactive(tenantId, workflowId);

    const conditions = await this.exitConditionRepo.findByWorkflowId(workflowId);
    const condition = conditions.find((c) => c.id === conditionId);
    if (!condition) {
      throw new NotFoundException('Exit condition not found');
    }

    if (dto.type !== undefined) condition.type = dto.type;
    if (dto.resource !== undefined) condition.resource = dto.resource;
    if (dto.operator !== undefined) condition.operator = dto.operator;
    if (dto.value !== undefined) condition.value = dto.value ?? null;

    const saved = await this.exitConditionRepo.save(condition);
    return this.mapExitConditionToResponse(saved);
  }

  async deleteExitCondition(
    tenantId: string,
    workflowId: string,
    conditionId: string,
  ): Promise<void> {
    await this.verifyWorkflowInactive(tenantId, workflowId);

    const conditions = await this.exitConditionRepo.findByWorkflowId(workflowId);
    if (!conditions.some((c) => c.id === conditionId)) {
      throw new NotFoundException('Exit condition not found');
    }

    await this.exitConditionRepo.delete(conditionId);
  }

  async findStep(
    tenantId: string,
    workflowId: string,
    stepId: string,
  ): Promise<WorkflowStepResponse> {
    await this.getWorkflowOrThrow(tenantId, workflowId);
    const steps = await this.stepRepo.findByWorkflowId(workflowId);
    const step = steps.find((s) => s.id === stepId);
    if (!step) {
      throw new NotFoundException('Step not found');
    }
    return this.mapStepToResponse(step);
  }

  async getExitConditions(
    tenantId: string,
    workflowId: string,
  ): Promise<WorkflowExitConditionResponse[]> {
    await this.getWorkflowOrThrow(tenantId, workflowId);
    const conditions = await this.exitConditionRepo.findByWorkflowId(workflowId);
    return conditions.map((c) => this.mapExitConditionToResponse(c));
  }

  async replaceExitConditions(
    tenantId: string,
    workflowId: string,
    dtos: CreateWorkflowExitConditionDto[],
  ): Promise<WorkflowExitConditionResponse[]> {
    await this.verifyWorkflowInactive(tenantId, workflowId);
    await this.exitConditionRepo.deleteByWorkflowId(workflowId);

    const conditionsToSave = dtos.map((dto) => {
      const condition = new WorkflowExitCondition();
      condition.tenantId = tenantId;
      condition.workflowId = workflowId;
      condition.type = dto.type;
      condition.resource = dto.resource;
      condition.operator = dto.operator;
      condition.value = dto.value ?? null;
      return condition;
    });

    let saved: WorkflowExitCondition[] = [];
    if (conditionsToSave.length > 0) {
      saved = await this.exitConditionRepo.save(conditionsToSave);
    }

    return saved.map((c) => this.mapExitConditionToResponse(c));
  }

  private async verifyWorkflowInactive(tenantId: string, workflowId: string): Promise<void> {
    const workflow = await this.getWorkflowOrThrow(tenantId, workflowId);
    if (workflow.isActive) {
      throw new BadRequestException('Cannot modify structural fields of an active workflow');
    }
  }

  private async invalidateTriggerCache(tenantId: string, workflowId: string): Promise<void> {
    if (!this.cacheService) return;
    const triggers = await this.triggerRepo.findByWorkflowId(workflowId);
    const events = [...new Set(triggers.map((t) => t.event))];
    for (const event of events) {
      try {
        const key = TriggerCacheService.getCacheKey(tenantId, event);
        await this.cacheService.del(key);
      } catch {
        // Ignore cache deletion errors
      }
    }
  }

  private async getWorkflowOrThrow(tenantId: string, workflowId: string): Promise<Workflow> {
    const workflow = await this.workflowRepo.findById(workflowId);
    if (!workflow || workflow.tenantId !== tenantId) {
      throw new NotFoundException('Workflow not found');
    }
    return workflow;
  }

  private async validateForActivation(workflowId: string): Promise<void> {
    const triggers = await this.triggerRepo.findByWorkflowId(workflowId);
    if (triggers.length === 0) {
      throw new BadRequestException('Workflow must have at least one trigger to be activated');
    }

    const steps = await this.stepRepo.findByWorkflowId(workflowId);
    if (steps.length === 0) {
      throw new BadRequestException('Workflow must have at least one step to be activated');
    }

    // Extended validation per requirements
    for (const step of steps) {
      if (!step.action) {
        throw new BadRequestException(`Step ${step.id} has no action configured`);
      }

      if (step.action === 'delay' && (!step.config?.amount || !step.config?.unit)) {
        throw new BadRequestException(`Delay step ${step.id} requires amount and unit`);
      }

      if (step.action === 'conditional_split') {
        if (!step.trueStepId || !step.falseStepId) {
          // Check if conditions exist in workflow_step_conditions
          const conditionsCount = await this.dataSource.query<{ count: string }[]>(
            `SELECT COUNT(*) FROM workflow_step_conditions WHERE workflow_step_id = $1`,
            [step.id],
          );
          if (!conditionsCount || parseInt(conditionsCount[0]?.count ?? '0') === 0) {
            throw new BadRequestException(
              `Conditional split step ${step.id} must have both true and false step routing or valid conditions in the database`,
            );
          }
        }
      }

      if (step.action === 'send_email') {
        if (!step.config?.templateId && (!step.config?.subject || !step.config?.html)) {
          throw new BadRequestException(
            `Email step ${step.id} requires either templateId OR (subject and html)`,
          );
        }
        if (step.config?.templateId) {
          const templateExists = await this.dataSource.query<{ id: string }[]>(
            `SELECT id FROM email_templates WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL LIMIT 1`,
            [step.config.templateId, step.tenantId],
          );
          if (!templateExists || templateExists.length === 0) {
            throw new BadRequestException(
              `Email step ${step.id} references a deleted or non-existent template`,
            );
          }
        }
      }

      if ((step.action === 'attach_tag' || step.action === 'detach_tag') && !step.config?.tagId) {
        throw new BadRequestException(`Tag step ${step.id} requires a tag reference`);
      }

      if (step.action === 'webhook') {
        const urlStr = typeof step.config?.url === 'string' ? step.config.url : '';
        if (!urlStr) {
          throw new BadRequestException(`Webhook step ${step.id} requires a valid URL`);
        }
        try {
          const parsedUrl = new URL(urlStr);
          const hostname = parsedUrl.hostname;
          if (
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname === '0.0.0.0' ||
            hostname === '[::1]' ||
            hostname === '[::]' ||
            hostname.startsWith('10.') ||
            hostname.startsWith('192.168.') ||
            hostname.startsWith('169.254.') ||
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
            /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./.test(hostname) || // CGN 100.64.0.0/10
            /^\[[fF][cC0-9a-fA-F]{3}:/.test(hostname) || // fc00::/7
            /^\[[fF][eE][89aAbB][0-9a-fA-F]:/.test(hostname) // fe80::/10
          ) {
            throw new BadRequestException(`Webhook step ${step.id} has an invalid or private URL`);
          }

          // DNS resolution check
          try {
            const dnsResult = await lookup(hostname);
            const address = dnsResult.address;
            if (
              address === '127.0.0.1' ||
              address === '0.0.0.0' ||
              address === '::1' ||
              address === '::' ||
              address.startsWith('10.') ||
              address.startsWith('192.168.') ||
              address.startsWith('169.254.') ||
              /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(address) ||
              /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./.test(address) ||
              /^[fF][cC0-9a-fA-F]{3}:/.test(address) ||
              /^[fF][eE][89aAbB][0-9a-fA-F]:/.test(address)
            ) {
              throw new BadRequestException(`Webhook step ${step.id} resolves to a private IP`);
            }
          } catch (dnsError) {
            // If DNS resolution fails, block it or let it pass?
            // Usually, if it doesn't resolve, we block it to prevent targeting internal unresolved names.
            if (dnsError instanceof BadRequestException) throw dnsError;
            throw new BadRequestException(`Webhook step ${step.id} domain could not be resolved`);
          }
        } catch (e) {
          if (e instanceof BadRequestException) throw e;
          throw new BadRequestException(`Webhook step ${step.id} has a malformed URL`);
        }
      }
    }

    const lastStep = [...steps].sort((a, b) => a.position - b.position)[steps.length - 1];
    if (lastStep?.action === 'delay') {
      throw new BadRequestException('A delay cannot be the final step in a workflow');
    }
  }

  private mapWorkflowToResponse(workflow: Workflow): WorkflowResponse {
    return {
      id: workflow.id,
      tenantId: workflow.tenantId,
      name: workflow.name,
      description: workflow.description ?? undefined,
      isActive: workflow.isActive,
      status: workflow.status,
      createdAt: workflow.createdAt.toISOString(),
      updatedAt: workflow.updatedAt.toISOString(),
      activatedAt: workflow.activatedAt?.toISOString(),
    };
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

  private mapExitConditionToResponse(
    condition: WorkflowExitCondition,
  ): WorkflowExitConditionResponse {
    return {
      id: condition.id,
      tenantId: condition.tenantId,
      workflowId: condition.workflowId,
      type: condition.type,
      resource: condition.resource ?? undefined,
      operator: condition.operator,
      value: condition.value ?? undefined,
      createdAt: condition.createdAt.toISOString(),
      updatedAt: condition.updatedAt.toISOString(),
    };
  }
}

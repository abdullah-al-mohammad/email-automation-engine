import {
  type CreateWorkflowStepConditionDto,
  CreateWorkflowStepConditionSchema,
  type WorkflowStepConditionResponse,
} from '@email-automation-engine/shared';
import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { z } from 'zod';

import { ZodValidationPipe } from '../../../infrastructure/pipes/zod-validation.pipe';
import { CurrentTenant } from '../../iam/interface/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../iam/interface/decorators/require-permissions.decorator';
import { AuthGuard } from '../../iam/interface/guards/auth.guard';
import { PermissionsGuard } from '../../iam/interface/guards/permissions.guard';
import { TenantMembershipGuard } from '../../iam/interface/guards/tenant-membership.guard';
import { WorkflowStepConditionService } from '../application/services/workflow-step-condition.service';

@Controller('tenants/:tenantId/workflows/:workflowId/steps/:stepId/conditions')
@UseGuards(AuthGuard, TenantMembershipGuard, PermissionsGuard)
export class WorkflowStepConditionController {
  constructor(private readonly conditionService: WorkflowStepConditionService) {}

  @Get()
  @RequirePermissions('workflows.read')
  async getConditions(
    @CurrentTenant('id') tenantId: string,
    @Param('workflowId') workflowId: string,
    @Param('stepId') stepId: string,
  ): Promise<WorkflowStepConditionResponse[]> {
    return this.conditionService.getConditions(tenantId, workflowId, stepId);
  }

  @Put()
  @RequirePermissions('workflows.manage')
  async replaceConditions(
    @CurrentTenant('id') tenantId: string,
    @Param('workflowId') workflowId: string,
    @Param('stepId') stepId: string,
    @Body(new ZodValidationPipe(z.array(CreateWorkflowStepConditionSchema)))
    dtos: CreateWorkflowStepConditionDto[],
  ): Promise<WorkflowStepConditionResponse[]> {
    return this.conditionService.replaceConditions(tenantId, workflowId, stepId, dtos);
  }
}

import {
  type ContactWorkflowResponse,
  type ContactWorkflowStepResponse,
} from '@email-automation-engine/shared';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { CurrentTenant } from '../../../../iam/interface/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../../../iam/interface/decorators/require-permissions.decorator';
import { AuthGuard } from '../../../../iam/interface/guards/auth.guard';
import { PermissionsGuard } from '../../../../iam/interface/guards/permissions.guard';
import { TenantMembershipGuard } from '../../../../iam/interface/guards/tenant-membership.guard';
import { ContactWorkflowService } from '../../../application/services/contact-workflow.service';

@Controller('tenants/:tenantId/workflows/:workflowId/execution')
export class ExecutionSummaryController {
  constructor(private readonly contactWorkflowService: ContactWorkflowService) {}

  @Get()
  @UseGuards(AuthGuard, TenantMembershipGuard, PermissionsGuard)
  @RequirePermissions('workflows.read')
  async listExecutions(
    @CurrentTenant('id') tenantId: string,
    @Param('workflowId') workflowId: string,
  ): Promise<ContactWorkflowResponse[]> {
    return this.contactWorkflowService.findManyByWorkflowId(tenantId, workflowId);
  }

  @Get(':contactWorkflowId')
  @UseGuards(AuthGuard, TenantMembershipGuard, PermissionsGuard)
  @RequirePermissions('workflows.read')
  async getExecutionTimeline(
    @CurrentTenant('id') tenantId: string,
    @Param('contactWorkflowId') contactWorkflowId: string,
  ): Promise<ContactWorkflowStepResponse[]> {
    return this.contactWorkflowService.findAllStepsByContactWorkflowId(tenantId, contactWorkflowId);
  }
}

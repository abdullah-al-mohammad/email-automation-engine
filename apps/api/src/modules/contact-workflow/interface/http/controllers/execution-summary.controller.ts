import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../../../../iam/interface/guards/permissions.guard';
import { RequirePermissions } from '../../../../iam/interface/decorators/require-permissions.decorator';
import {
  type ContactWorkflowResponse,
  type ContactWorkflowStepResponse,
} from '@email-automation-engine/shared';
import { ContactWorkflowService } from '../../../application/services/contact-workflow.service';
import { AuthGuard } from '../../../../iam/interface/guards/auth.guard';
import { TenantMembershipGuard } from '../../../../iam/interface/guards/tenant-membership.guard';

@Controller('tenants/:tenantId/workflows/:workflowId/execution')
export class ExecutionSummaryController {
  constructor(private readonly contactWorkflowService: ContactWorkflowService) {}

  @Get()
  @UseGuards(AuthGuard, TenantMembershipGuard, PermissionsGuard)
  @RequirePermissions('workflows.read')
  async listExecutions(
    @Param('tenantId') tenantId: string,
    @Param('workflowId') workflowId: string,
  ): Promise<ContactWorkflowResponse[]> {
    return this.contactWorkflowService.findManyByWorkflowId(tenantId, workflowId);
  }

  @Get(':contactWorkflowId')
  @UseGuards(AuthGuard, TenantMembershipGuard, PermissionsGuard)
  @RequirePermissions('workflows.read')
  async getExecutionTimeline(
    @Param('tenantId') tenantId: string,
    @Param('contactWorkflowId') contactWorkflowId: string,
  ): Promise<ContactWorkflowStepResponse[]> {
    return this.contactWorkflowService.findAllStepsByContactWorkflowId(tenantId, contactWorkflowId);
  }
}

import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { type ContactWorkflowResponse, type ContactWorkflowStepResponse } from '@email-automation-engine/shared';
import { ContactWorkflowService } from '../../../application/services/contact-workflow.service';
import { AuthGuard } from '../../../../iam/interface/guards/auth.guard';
import { TenantMembershipGuard } from '../../../../iam/interface/guards/tenant-membership.guard';

@Controller('tenants/:tenantId/workflows/:workflowId/execution')
export class ExecutionSummaryController {
  constructor(private readonly contactWorkflowService: ContactWorkflowService) {}

  @Get()
  @UseGuards(AuthGuard, TenantMembershipGuard)
  async listExecutions(
    @Param('tenantId') tenantId: string,
    @Param('workflowId') workflowId: string,
  ): Promise<ContactWorkflowResponse[]> {
    return this.contactWorkflowService.findManyByWorkflowId(workflowId);
  }

  @Get(':contactWorkflowId')
  @UseGuards(AuthGuard, TenantMembershipGuard)
  async getExecutionTimeline(
    @Param('tenantId') tenantId: string,
    @Param('contactWorkflowId') contactWorkflowId: string,
  ): Promise<ContactWorkflowStepResponse[]> {
    return this.contactWorkflowService.findAllStepsByContactWorkflowId(contactWorkflowId);
  }
}

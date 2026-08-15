import { AutomationEventDto, AutomationEventSchema } from '@email-automation-engine/shared';
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';

import { ZodValidationPipe } from '../../../../../infrastructure/pipes/zod-validation.pipe';
import { CurrentTenant } from '../../../../iam/interface/decorators/current-tenant.decorator';
import { AuthGuard } from '../../../../iam/interface/guards/auth.guard';
import { TenantMembershipGuard } from '../../../../iam/interface/guards/tenant-membership.guard';
import { AutomationEventService } from '../../../application/services/automation-event.service';

@Controller('automation/events')
@UseGuards(AuthGuard, TenantMembershipGuard)
export class AutomationEventController {
  constructor(private readonly automationEventService: AutomationEventService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async ingestEvent(
    @Body(new ZodValidationPipe(AutomationEventSchema)) dto: AutomationEventDto,
    @CurrentTenant('id') tenantId: string,
  ): Promise<{ accepted: boolean }> {
    await this.automationEventService.ingest(tenantId, dto);
    return { accepted: true };
  }
}

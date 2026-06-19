import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  UsePipes,
  HttpCode,
} from '@nestjs/common';
import {
  createTenantInvitationSchema,
  type CreateTenantInvitationDto,
  type TenantInvitationResponse,
} from '@email-automation-engine/shared';
import { TenantInvitationService } from '../../application/services/tenant-invitation.service';
import { AuthGuard } from '../guards/auth.guard';
import { TenantMembershipGuard } from '../guards/tenant-membership.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CurrentTenant } from '../decorators/current-tenant.decorator';
import { ZodValidationPipe } from '../../../../infrastructure/pipes/zod-validation.pipe';

@Controller('tenants/:tenantId/invitations')
@UseGuards(AuthGuard, TenantMembershipGuard, PermissionsGuard)
export class TenantInvitationController {
  constructor(private readonly invitationService: TenantInvitationService) {}

  @Get()
  @RequirePermissions('members.read')
  async findAll(@CurrentTenant('id') tenantId: string): Promise<TenantInvitationResponse[]> {
    return this.invitationService.findAllByTenantId(tenantId);
  }

  @Post()
  @RequirePermissions('members.manage')
  @UsePipes(new ZodValidationPipe(createTenantInvitationSchema))
  async create(
    @CurrentTenant('id') tenantId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateTenantInvitationDto,
  ): Promise<TenantInvitationResponse> {
    return this.invitationService.create(tenantId, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermissions('members.manage')
  async delete(@CurrentTenant('id') tenantId: string, @Param('id') id: string): Promise<void> {
    return this.invitationService.delete(tenantId, id);
  }
}

import { type TenantMemberResponse } from '@email-automation-engine/shared';
import { Controller, Delete, Get, HttpCode, Param, UseGuards } from '@nestjs/common';

import { TenantMemberService } from '../../application/services/tenant-member.service';
import { CurrentTenant } from '../decorators/current-tenant.decorator';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { AuthGuard } from '../guards/auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { TenantMembershipGuard } from '../guards/tenant-membership.guard';

@Controller('tenants/:tenantId/members')
@UseGuards(AuthGuard, TenantMembershipGuard, PermissionsGuard)
export class TenantMemberController {
  constructor(private readonly tenantMemberService: TenantMemberService) {}

  @Get()
  @RequirePermissions('members.read')
  async findAll(@CurrentTenant('id') tenantId: string): Promise<TenantMemberResponse[]> {
    return this.tenantMemberService.findAllByTenantId(tenantId);
  }

  @Delete(':userId')
  @HttpCode(204)
  @RequirePermissions('members.manage')
  async delete(
    @CurrentTenant('id') tenantId: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    return this.tenantMemberService.delete(tenantId, userId);
  }
}

import { Controller, Get, Delete, Param, UseGuards, HttpCode } from '@nestjs/common';
import { type TenantMemberResponse } from '@email-automation-engine/shared';
import { TenantMemberService } from '../../application/services/tenant-member.service';
import { AuthGuard } from '../guards/auth.guard';
import { TenantMembershipGuard } from '../guards/tenant-membership.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { CurrentTenant } from '../decorators/current-tenant.decorator';

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

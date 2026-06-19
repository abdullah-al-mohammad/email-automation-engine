import { Controller, Get, UseGuards } from '@nestjs/common';
import { type TagResponse } from '@email-automation-engine/shared';
import { TagService } from '../../../application/services/tag.service';
import { AuthGuard } from '../../../../iam/interface/guards/auth.guard';
import { TenantMembershipGuard } from '../../../../iam/interface/guards/tenant-membership.guard';
import { PermissionsGuard } from '../../../../iam/interface/guards/permissions.guard';
import { RequirePermissions } from '../../../../iam/interface/decorators/require-permissions.decorator';
import { CurrentTenant } from '../../../../iam/interface/decorators/current-tenant.decorator';

@Controller('tenants/:tenantId/tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  @UseGuards(AuthGuard, TenantMembershipGuard, PermissionsGuard)
  @RequirePermissions('contacts.read')
  async findAll(@CurrentTenant('id') tenantId: string): Promise<TagResponse[]> {
    return this.tagService.findAllByTenantId(tenantId);
  }
}

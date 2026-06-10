import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { type TagResponse } from '@email-automation-engine/shared';
import { TagService } from '../../../application/services/tag.service';
import { AuthGuard } from '../../../../iam/interface/guards/auth.guard';
import { TenantMembershipGuard } from '../../../../iam/interface/guards/tenant-membership.guard';

@Controller('tenants/:tenantId/tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  @UseGuards(AuthGuard, TenantMembershipGuard)
  async findAll(@Param('tenantId') tenantId: string): Promise<TagResponse[]> {
    return this.tagService.findAllByTenantId(tenantId);
  }
}

import { type CreateTagDto, type TagResponse } from '@email-automation-engine/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentTenant } from '../../../../iam/interface/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../../../iam/interface/decorators/require-permissions.decorator';
import { AuthGuard } from '../../../../iam/interface/guards/auth.guard';
import { PermissionsGuard } from '../../../../iam/interface/guards/permissions.guard';
import { TenantMembershipGuard } from '../../../../iam/interface/guards/tenant-membership.guard';
import { TagService } from '../../../application/services/tag.service';

@Controller('tenants/:tenantId/tags')
@UseGuards(AuthGuard, TenantMembershipGuard, PermissionsGuard)
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  @RequirePermissions('contacts.read')
  async findAll(@CurrentTenant('id') tenantId: string): Promise<TagResponse[]> {
    return this.tagService.findAllByTenantId(tenantId);
  }

  @Post()
  @RequirePermissions('tags.manage')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentTenant('id') tenantId: string,
    @Body() dto: CreateTagDto,
  ): Promise<TagResponse> {
    return this.tagService.create(tenantId, dto);
  }

  @Delete(':tagId')
  @RequirePermissions('tags.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentTenant('id') tenantId: string,
    @Param('tagId') tagId: string,
  ): Promise<void> {
    await this.tagService.delete(tenantId, tagId);
  }
}

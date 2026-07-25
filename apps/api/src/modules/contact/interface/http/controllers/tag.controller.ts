import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { type TagResponse, type CreateTagDto } from '@email-automation-engine/shared';
import { TagService } from '../../../application/services/tag.service';
import { AuthGuard } from '../../../../iam/interface/guards/auth.guard';
import { TenantMembershipGuard } from '../../../../iam/interface/guards/tenant-membership.guard';
import { PermissionsGuard } from '../../../../iam/interface/guards/permissions.guard';
import { RequirePermissions } from '../../../../iam/interface/decorators/require-permissions.decorator';
import { CurrentTenant } from '../../../../iam/interface/decorators/current-tenant.decorator';

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

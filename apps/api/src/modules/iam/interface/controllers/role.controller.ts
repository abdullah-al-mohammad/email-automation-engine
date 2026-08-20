import {
  type CreateRoleDto,
  createRoleSchema,
  type RoleResponse,
  type UpdateRoleDto,
  updateRoleSchema,
} from '@email-automation-engine/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';

import { ZodValidationPipe } from '../../../../infrastructure/pipes/zod-validation.pipe';
import { RoleService } from '../../application/services/role.service';
import { CurrentTenant } from '../decorators/current-tenant.decorator';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { AuthGuard } from '../guards/auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { TenantMembershipGuard } from '../guards/tenant-membership.guard';

@Controller('tenants/:tenantId/roles')
@UseGuards(AuthGuard, TenantMembershipGuard, PermissionsGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @RequirePermissions('settings.manage')
  async findAll(@CurrentTenant('id') tenantId: string): Promise<RoleResponse[]> {
    return this.roleService.findAllByTenantId(tenantId);
  }

  @Post()
  @RequirePermissions('settings.manage')
  @UsePipes(new ZodValidationPipe(createRoleSchema))
  async create(
    @CurrentTenant('id') tenantId: string,
    @Body() dto: CreateRoleDto,
  ): Promise<RoleResponse> {
    return this.roleService.create(tenantId, dto);
  }

  @Patch(':id')
  @RequirePermissions('settings.manage')
  @UsePipes(new ZodValidationPipe(updateRoleSchema))
  async update(
    @CurrentTenant('id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<RoleResponse> {
    return this.roleService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermissions('settings.manage')
  async delete(@CurrentTenant('id') tenantId: string, @Param('id') id: string): Promise<void> {
    return this.roleService.delete(tenantId, id);
  }
}

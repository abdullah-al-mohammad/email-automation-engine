import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UsePipes,
  HttpCode,
} from '@nestjs/common';
import {
  createRoleSchema,
  updateRoleSchema,
  type CreateRoleDto,
  type UpdateRoleDto,
  type RoleResponse,
} from '@email-automation-engine/shared';
import { RoleService } from '../../application/services/role.service';
import { AuthGuard } from '../guards/auth.guard';
import { TenantMembershipGuard } from '../guards/tenant-membership.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { CurrentTenant } from '../decorators/current-tenant.decorator';
import { ZodValidationPipe } from '../../../../infrastructure/pipes/zod-validation.pipe';

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

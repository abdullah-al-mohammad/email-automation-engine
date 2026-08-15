import {
  type CreateTenantDto,
  createTenantSchema,
  type TenantResponse,
  type UpdateTenantDto,
  updateTenantSchema,
} from '@email-automation-engine/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';

import { ZodValidationPipe } from '../../../../infrastructure/pipes/zod-validation.pipe';
import { TenantService } from '../../application/services/tenant.service';
import { CurrentUser } from '../decorators/current-user.decorator';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { AuthGuard } from '../guards/auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { TenantMembershipGuard } from '../guards/tenant-membership.guard';

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @UseGuards(AuthGuard)
  @UsePipes(new ZodValidationPipe(createTenantSchema))
  async create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateTenantDto,
  ): Promise<TenantResponse> {
    return this.tenantService.create(user.id, dto);
  }

  @Get()
  @UseGuards(AuthGuard)
  async findByUser(@CurrentUser() user: { id: string }): Promise<TenantResponse[]> {
    return this.tenantService.findByUser(user.id);
  }

  @Get(':id')
  @UseGuards(AuthGuard, TenantMembershipGuard, PermissionsGuard)
  @RequirePermissions('tenant.read')
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ): Promise<TenantResponse> {
    return this.tenantService.findById(id, user.id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, TenantMembershipGuard, PermissionsGuard)
  @RequirePermissions('tenant.update')
  @UsePipes(new ZodValidationPipe(updateTenantSchema))
  async update(@Param('id') id: string, @Body() dto: UpdateTenantDto): Promise<TenantResponse> {
    return this.tenantService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, TenantMembershipGuard, PermissionsGuard)
  @RequirePermissions('tenant.update')
  async delete(@Param('id') id: string, @CurrentUser() user: { id: string }): Promise<void> {
    return this.tenantService.delete(id, user.id);
  }
}

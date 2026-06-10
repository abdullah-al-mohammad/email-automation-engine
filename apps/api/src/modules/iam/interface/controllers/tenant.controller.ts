import { Controller, Post, Get, Patch, Body, Param, UseGuards, UsePipes } from '@nestjs/common';
import {
  createTenantSchema,
  updateTenantSchema,
  type CreateTenantDto,
  type UpdateTenantDto,
  type TenantResponse,
} from '@email-automation-engine/shared';
import { TenantService } from '../../application/services/tenant.service';
import { AuthGuard } from '../guards/auth.guard';
import { TenantMembershipGuard } from '../guards/tenant-membership.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../../infrastructure/pipes/zod-validation.pipe';

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
}

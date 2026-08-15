import {
  CreateEmailTemplateDto,
  EmailTemplateResponse,
  UpdateEmailTemplateDto,
} from '@email-automation-engine/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentTenant } from '../../../../iam/interface/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../../../iam/interface/decorators/require-permissions.decorator';
import { AuthGuard } from '../../../../iam/interface/guards/auth.guard';
import { PermissionsGuard } from '../../../../iam/interface/guards/permissions.guard';
import { TenantMembershipGuard } from '../../../../iam/interface/guards/tenant-membership.guard';
import { EmailTemplateService } from '../../../application/services/email-template.service';
import type { EmailTemplate } from '../../../domain/aggregates/email-template.aggregate';

@Controller('tenants/:tenantId/email-templates')
@UseGuards(AuthGuard, TenantMembershipGuard, PermissionsGuard)
export class EmailTemplateController {
  constructor(private readonly emailTemplateService: EmailTemplateService) {}

  @Post()
  @RequirePermissions('workflows.manage')
  async create(
    @CurrentTenant('id') tenantId: string,
    @Body() dto: CreateEmailTemplateDto,
  ): Promise<EmailTemplateResponse> {
    const template = await this.emailTemplateService.create(tenantId, dto);
    return this.mapToResponse(template);
  }

  @Get()
  @RequirePermissions('workflows.read')
  async findAll(@CurrentTenant('id') tenantId: string): Promise<EmailTemplateResponse[]> {
    const templates = await this.emailTemplateService.findAll(tenantId);
    return templates.map((t: EmailTemplate) => this.mapToResponse(t));
  }

  @Get(':id')
  @RequirePermissions('workflows.read')
  async findOne(
    @CurrentTenant('id') tenantId: string,
    @Param('id') id: string,
  ): Promise<EmailTemplateResponse> {
    const template = await this.emailTemplateService.findOne(tenantId, id);
    return this.mapToResponse(template);
  }

  @Patch(':id')
  @RequirePermissions('workflows.manage')
  async update(
    @CurrentTenant('id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEmailTemplateDto,
  ): Promise<EmailTemplateResponse> {
    const template = await this.emailTemplateService.update(tenantId, id, dto);
    return this.mapToResponse(template);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('workflows.manage')
  async remove(@CurrentTenant('id') tenantId: string, @Param('id') id: string): Promise<void> {
    await this.emailTemplateService.softDelete(tenantId, id);
  }

  private mapToResponse(template: EmailTemplate): EmailTemplateResponse {
    return {
      id: template.id,
      tenantId: template.tenantId,
      name: template.name,
      subject: template.subject,
      html: template.html,
      text: template.text,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
      deletedAt: template.deletedAt ? template.deletedAt.toISOString() : null,
    };
  }
}

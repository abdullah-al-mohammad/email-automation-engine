import {
  type ContactResponse,
  type CreateContactDto,
  type ImportContactsResult,
  type PaginatedContactResponse,
  type UpdateContactDto,
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
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { CurrentTenant } from '../../../../iam/interface/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../../../iam/interface/decorators/require-permissions.decorator';
import { AuthGuard } from '../../../../iam/interface/guards/auth.guard';
import { PermissionsGuard } from '../../../../iam/interface/guards/permissions.guard';
import { TenantMembershipGuard } from '../../../../iam/interface/guards/tenant-membership.guard';
import { ContactService } from '../../../application/services/contact.service';
import {
  ContactImportService,
  type CsvPreview,
} from '../../../application/services/contact-import.service';

@Controller('tenants/:tenantId/contacts')
@UseGuards(AuthGuard, TenantMembershipGuard, PermissionsGuard)
export class ContactController {
  constructor(
    private readonly contactService: ContactService,
    private readonly contactImportService: ContactImportService,
  ) {}

  @Get()
  @RequirePermissions('contacts.read')
  async findAll(
    @CurrentTenant('id') tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('tagId') tagId?: string,
    @Query('subscribed') subscribed?: string,
  ): Promise<PaginatedContactResponse> {
    const pageNum = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit ?? '20', 10) || 20));
    const tagIds = tagId ? tagId.split(',') : undefined;
    const subscribedFilter = subscribed !== undefined ? subscribed === 'true' : undefined;

    return this.contactService.findPaginated(tenantId, {
      page: pageNum,
      limit: limitNum,
      search,
      tagIds,
      subscribed: subscribedFilter,
    });
  }

  @Post('import/preview')
  @RequirePermissions('contacts.read')
  @UseInterceptors(FileInterceptor('file'))
  previewCsv(@UploadedFile() file: Express.Multer.File): CsvPreview {
    return this.contactImportService.previewCsv(file.buffer);
  }

  @Post('import')
  @RequirePermissions('contacts.manage')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async importCsv(
    @CurrentTenant('id') tenantId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ImportContactsResult> {
    return this.contactImportService.importCsv(tenantId, file.buffer);
  }

  @Get(':contactId')
  @RequirePermissions('contacts.read')
  async findOne(
    @CurrentTenant('id') tenantId: string,
    @Param('contactId') contactId: string,
  ): Promise<ContactResponse> {
    const contact = await this.contactService.findById(contactId);
    if (!contact || contact.tenantId !== tenantId) {
      throw new Error('Contact not found');
    }
    return {
      id: contact.id,
      tenantId: contact.tenantId,
      email: contact.email,
      subscribed: contact.subscribed,
      metadata: contact.metadata ?? {},
      createdAt: contact.createdAt.toISOString(),
      updatedAt: contact.updatedAt.toISOString(),
    };
  }

  @Post()
  @RequirePermissions('contacts.manage')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentTenant('id') tenantId: string,
    @Body() dto: CreateContactDto,
  ): Promise<ContactResponse> {
    return this.contactService.create(tenantId, dto);
  }

  @Patch(':contactId')
  @RequirePermissions('contacts.manage')
  async update(
    @CurrentTenant('id') tenantId: string,
    @Param('contactId') contactId: string,
    @Body() dto: UpdateContactDto,
  ): Promise<ContactResponse> {
    return this.contactService.update(tenantId, contactId, dto);
  }

  @Delete(':contactId')
  @RequirePermissions('contacts.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentTenant('id') tenantId: string,
    @Param('contactId') contactId: string,
  ): Promise<void> {
    await this.contactService.delete(tenantId, contactId);
  }

  @Post(':contactId/tags/:tagId')
  @RequirePermissions('contacts.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  async assignTag(
    @CurrentTenant('id') tenantId: string,
    @Param('contactId') contactId: string,
    @Param('tagId') tagId: string,
  ): Promise<void> {
    await this.contactService.assignTag(tenantId, contactId, tagId);
  }

  @Delete(':contactId/tags/:tagId')
  @RequirePermissions('contacts.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeTag(
    @CurrentTenant('id') tenantId: string,
    @Param('contactId') contactId: string,
    @Param('tagId') tagId: string,
  ): Promise<void> {
    await this.contactService.removeTag(tenantId, contactId, tagId);
  }
}

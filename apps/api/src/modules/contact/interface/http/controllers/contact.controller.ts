import { Controller, Get, UseGuards } from '@nestjs/common';
import { type ContactResponse } from '@email-automation-engine/shared';
import { ContactService } from '../../../application/services/contact.service';
import { AuthGuard } from '../../../../iam/interface/guards/auth.guard';
import { TenantMembershipGuard } from '../../../../iam/interface/guards/tenant-membership.guard';
import { PermissionsGuard } from '../../../../iam/interface/guards/permissions.guard';
import { RequirePermissions } from '../../../../iam/interface/decorators/require-permissions.decorator';
import { CurrentTenant } from '../../../../iam/interface/decorators/current-tenant.decorator';

@Controller('tenants/:tenantId/contacts')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  @UseGuards(AuthGuard, TenantMembershipGuard, PermissionsGuard)
  @RequirePermissions('contacts.read')
  async findAll(@CurrentTenant('id') tenantId: string): Promise<ContactResponse[]> {
    return this.contactService.findAllByTenantId(tenantId);
  }
}

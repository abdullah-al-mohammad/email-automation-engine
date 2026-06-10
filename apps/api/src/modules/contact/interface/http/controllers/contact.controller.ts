import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { type ContactResponse } from '@email-automation-engine/shared';
import { ContactService } from '../../../application/services/contact.service';
import { AuthGuard } from '../../../../iam/interface/guards/auth.guard';
import { TenantMembershipGuard } from '../../../../iam/interface/guards/tenant-membership.guard';

@Controller('tenants/:tenantId/contacts')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  @UseGuards(AuthGuard, TenantMembershipGuard)
  async findAll(@Param('tenantId') tenantId: string): Promise<ContactResponse[]> {
    return this.contactService.findAllByTenantId(tenantId);
  }
}

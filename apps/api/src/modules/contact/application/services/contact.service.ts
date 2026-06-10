import { Injectable, Inject } from '@nestjs/common';
import { CONTACT_REPOSITORY } from '../../constants/tokens';
import { ContactRepository } from '../../domain/repositories/contact.repository';
import { Contact } from '../../domain/aggregates/contact.aggregate';
import { type ContactResponse } from '@email-automation-engine/shared';

@Injectable()
export class ContactService {
  constructor(
    @Inject(CONTACT_REPOSITORY)
    private readonly contactRepository: ContactRepository,
  ) {}

  async findById(id: string): Promise<Contact | null> {
    return this.contactRepository.findById(id);
  }

  async findByTenantIdAndEmail(tenantId: string, email: string): Promise<Contact | null> {
    return this.contactRepository.findByTenantIdAndEmail(tenantId, email);
  }

  async findAllByTenantId(tenantId: string): Promise<ContactResponse[]> {
    const contacts = await this.contactRepository.findAllByTenantId(tenantId);
    return contacts.map((c) => ({
      id: c.id,
      tenantId: c.tenantId,
      email: c.email,
      subscribed: c.subscribed,
      metadata: c.metadata ?? {},
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }
}

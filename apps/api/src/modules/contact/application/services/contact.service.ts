import { Injectable, Inject } from '@nestjs/common';
import { CONTACT_REPOSITORY } from '../../constants/tokens';
import { ContactRepository } from '../../domain/repositories/contact.repository';
import { Contact } from '../../domain/aggregates/contact.aggregate';

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
}

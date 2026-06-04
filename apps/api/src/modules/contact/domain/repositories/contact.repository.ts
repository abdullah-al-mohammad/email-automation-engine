import type { Contact } from '../aggregates/contact.aggregate';

export interface ContactRepository {
  findById(id: string): Promise<Contact | null>;
  findByTenantIdAndEmail(tenantId: string, email: string): Promise<Contact | null>;
  save(contact: Contact): Promise<Contact>;
}

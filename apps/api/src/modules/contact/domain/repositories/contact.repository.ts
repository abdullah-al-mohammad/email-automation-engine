import type { Contact } from '../aggregates/contact.aggregate';

export interface FindContactsOptions {
  page: number;
  limit: number;
  search?: string;
  tagIds?: string[];
  subscribed?: boolean;
}

export interface PaginatedContacts {
  data: Contact[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ContactRepository {
  findById(id: string): Promise<Contact | null>;
  findAllByTenantId(tenantId: string): Promise<Contact[]>;
  findPaginated(tenantId: string, options: FindContactsOptions): Promise<PaginatedContacts>;
  findByTenantIdAndEmail(tenantId: string, email: string): Promise<Contact | null>;
  save(contact: Contact): Promise<Contact>;
  deleteById(id: string): Promise<void>;
}

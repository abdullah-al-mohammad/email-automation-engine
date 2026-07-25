import type { ContactTag } from '../aggregates/contact-tag.aggregate';

export interface ContactTagRepository {
  findByContactAndTag(contactId: string, tagId: string): Promise<ContactTag | null>;
  save(contactTag: ContactTag): Promise<ContactTag>;
  delete(contactId: string, tagId: string): Promise<void>;
  deleteByContactId(contactId: string): Promise<void>;
}

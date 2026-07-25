import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import { CONTACT_REPOSITORY, TAG_REPOSITORY, CONTACT_TAG_REPOSITORY } from '../../constants/tokens';
import { ContactRepository, FindContactsOptions } from '../../domain/repositories/contact.repository';
import { TagRepository } from '../../domain/repositories/tag.repository';
import { ContactTagRepository } from '../../domain/repositories/contact-tag.repository';
import { Contact } from '../../domain/aggregates/contact.aggregate';
import { ContactTag } from '../../domain/aggregates/contact-tag.aggregate';
import {
  type ContactResponse,
  type PaginatedContactResponse,
  type CreateContactDto,
  type UpdateContactDto,
} from '@email-automation-engine/shared';

@Injectable()
export class ContactService {
  constructor(
    @Inject(CONTACT_REPOSITORY)
    private readonly contactRepository: ContactRepository,
    @Inject(TAG_REPOSITORY)
    private readonly tagRepository: TagRepository,
    @Inject(CONTACT_TAG_REPOSITORY)
    private readonly contactTagRepository: ContactTagRepository,
  ) {}

  async findById(id: string): Promise<Contact | null> {
    return this.contactRepository.findById(id);
  }

  async findByTenantIdAndEmail(tenantId: string, email: string): Promise<Contact | null> {
    return this.contactRepository.findByTenantIdAndEmail(tenantId, email);
  }

  async findAllByTenantId(tenantId: string): Promise<ContactResponse[]> {
    const contacts = await this.contactRepository.findAllByTenantId(tenantId);
    return contacts.map((c) => this.toResponse(c));
  }

  async findPaginated(
    tenantId: string,
    options: FindContactsOptions,
  ): Promise<PaginatedContactResponse> {
    const result = await this.contactRepository.findPaginated(tenantId, options);
    return {
      data: result.data.map((c) => this.toResponse(c)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  async create(tenantId: string, dto: CreateContactDto): Promise<ContactResponse> {
    const existing = await this.contactRepository.findByTenantIdAndEmail(tenantId, dto.email);
    if (existing) {
      throw new ConflictException('A contact with this email already exists');
    }

    const contact = new Contact();
    contact.tenantId = tenantId;
    contact.email = dto.email;
    contact.subscribed = dto.subscribed ?? true;
    contact.metadata = dto.metadata ?? {};

    const saved = await this.contactRepository.save(contact);
    return this.toResponse(saved);
  }

  async update(
    tenantId: string,
    contactId: string,
    dto: UpdateContactDto,
  ): Promise<ContactResponse> {
    const contact = await this.contactRepository.findById(contactId);
    if (!contact || contact.tenantId !== tenantId) {
      throw new NotFoundException('Contact not found');
    }

    if (dto.email && dto.email !== contact.email) {
      const existing = await this.contactRepository.findByTenantIdAndEmail(tenantId, dto.email);
      if (existing) {
        throw new ConflictException('A contact with this email already exists');
      }
      contact.email = dto.email;
    }

    if (dto.subscribed !== undefined) {
      contact.subscribed = dto.subscribed;
    }

    if (dto.metadata !== undefined) {
      contact.metadata = dto.metadata;
    }

    const saved = await this.contactRepository.save(contact);
    return this.toResponse(saved);
  }

  async delete(tenantId: string, contactId: string): Promise<void> {
    const contact = await this.contactRepository.findById(contactId);
    if (!contact || contact.tenantId !== tenantId) {
      throw new NotFoundException('Contact not found');
    }
    await this.contactTagRepository.deleteByContactId(contactId);
    await this.contactRepository.deleteById(contactId);
  }

  async assignTag(tenantId: string, contactId: string, tagId: string): Promise<void> {
    const contact = await this.contactRepository.findById(contactId);
    if (!contact || contact.tenantId !== tenantId) {
      throw new NotFoundException('Contact not found');
    }

    const tag = await this.tagRepository.findById(tagId);
    if (!tag || tag.tenantId !== tenantId) {
      throw new NotFoundException('Tag not found');
    }

    const existing = await this.contactTagRepository.findByContactAndTag(contactId, tagId);
    if (existing) {
      return;
    }

    const contactTag = new ContactTag();
    contactTag.contactId = contactId;
    contactTag.tagId = tagId;
    await this.contactTagRepository.save(contactTag);
  }

  async removeTag(tenantId: string, contactId: string, tagId: string): Promise<void> {
    const contact = await this.contactRepository.findById(contactId);
    if (!contact || contact.tenantId !== tenantId) {
      throw new NotFoundException('Contact not found');
    }

    await this.contactTagRepository.delete(contactId, tagId);
  }

  private toResponse(contact: Contact): ContactResponse {
    return {
      id: contact.id,
      tenantId: contact.tenantId,
      email: contact.email,
      subscribed: contact.subscribed,
      metadata: contact.metadata ?? {},
      tags: contact.tags?.map((t) => ({ id: t.id, name: t.name, tenantId: t.tenantId, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() })),
      createdAt: contact.createdAt.toISOString(),
      updatedAt: contact.updatedAt.toISOString(),
    };
  }
}

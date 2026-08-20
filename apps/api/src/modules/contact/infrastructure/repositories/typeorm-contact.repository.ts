import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Contact } from '../../domain/aggregates/contact.aggregate';
import {
  ContactRepository,
  FindContactsOptions,
  PaginatedContacts,
} from '../../domain/repositories/contact.repository';

@Injectable()
export class TypeOrmContactRepository implements ContactRepository {
  constructor(
    @InjectRepository(Contact)
    private readonly repository: Repository<Contact>,
  ) {}

  async findById(id: string): Promise<Contact | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAllByTenantId(tenantId: string): Promise<Contact[]> {
    return this.repository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findPaginated(tenantId: string, options: FindContactsOptions): Promise<PaginatedContacts> {
    const { page, limit, search, tagIds, subscribed } = options;
    const skip = (page - 1) * limit;

    const qb = this.repository
      .createQueryBuilder('contact')
      .leftJoinAndSelect('contact.tags', 'tag')
      .where('contact.tenantId = :tenantId', { tenantId });

    if (search) {
      qb.andWhere('contact.email ILIKE :search', { search: `%${search}%` });
    }

    if (subscribed !== undefined) {
      qb.andWhere('contact.subscribed = :subscribed', { subscribed });
    }

    if (tagIds && tagIds.length > 0) {
      qb.andWhere('tag.id IN (:...tagIds)', { tagIds });
    }

    const total = await qb.getCount();
    const data = await qb.orderBy('contact.createdAt', 'DESC').skip(skip).take(limit).getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByTenantIdAndEmail(tenantId: string, email: string): Promise<Contact | null> {
    return this.repository.findOne({ where: { tenantId, email } });
  }

  async save(contact: Contact): Promise<Contact> {
    return this.repository.save(contact);
  }

  async deleteById(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}

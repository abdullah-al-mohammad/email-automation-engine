import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactTag } from '../../domain/aggregates/contact-tag.aggregate';
import { ContactTagRepository } from '../../domain/repositories/contact-tag.repository';

@Injectable()
export class TypeOrmContactTagRepository implements ContactTagRepository {
  constructor(
    @InjectRepository(ContactTag)
    private readonly repository: Repository<ContactTag>,
  ) {}

  async findByContactAndTag(contactId: string, tagId: string): Promise<ContactTag | null> {
    return this.repository.findOne({ where: { contactId, tagId } });
  }

  async save(contactTag: ContactTag): Promise<ContactTag> {
    return this.repository.save(contactTag);
  }

  async delete(contactId: string, tagId: string): Promise<void> {
    await this.repository.delete({ contactId, tagId });
  }

  async deleteByContactId(contactId: string): Promise<void> {
    await this.repository.delete({ contactId });
  }
}

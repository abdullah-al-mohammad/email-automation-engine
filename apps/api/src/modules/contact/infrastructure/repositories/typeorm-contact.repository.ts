import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from '../../domain/aggregates/contact.aggregate';
import { ContactRepository } from '../../domain/repositories/contact.repository';

@Injectable()
export class TypeOrmContactRepository implements ContactRepository {
  constructor(
    @InjectRepository(Contact)
    private readonly repository: Repository<Contact>,
  ) {}

  async findById(id: string): Promise<Contact | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByTenantIdAndEmail(tenantId: string, email: string): Promise<Contact | null> {
    return this.repository.findOne({ where: { tenantId, email } });
  }

  async save(contact: Contact): Promise<Contact> {
    return this.repository.save(contact);
  }
}

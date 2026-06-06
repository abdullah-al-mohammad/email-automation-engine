import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplate } from '../../domain/aggregates/email-template.aggregate';
import { IEmailTemplateRepository } from '../../domain/repositories/email-template.repository';

@Injectable()
export class TypeOrmEmailTemplateRepository implements IEmailTemplateRepository {
  constructor(
    @InjectRepository(EmailTemplate)
    private readonly repository: Repository<EmailTemplate>,
  ) {}

  async create(template: EmailTemplate): Promise<EmailTemplate> {
    return this.repository.save(template);
  }

  async findById(tenantId: string, id: string): Promise<EmailTemplate | null> {
    return this.repository.findOne({ where: { id, tenantId } });
  }

  async findAll(tenantId: string): Promise<EmailTemplate[]> {
    return this.repository.find({ where: { tenantId } });
  }

  async update(template: EmailTemplate): Promise<EmailTemplate> {
    return this.repository.save(template);
  }

  async softDelete(template: EmailTemplate): Promise<void> {
    await this.repository.softRemove(template);
  }
}

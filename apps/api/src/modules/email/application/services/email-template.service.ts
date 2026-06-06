import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IEmailTemplateRepository } from '../../domain/repositories/email-template.repository';
import { EMAIL_TEMPLATE_REPOSITORY } from '../../constants/tokens';
import { EmailTemplate } from '../../domain/aggregates/email-template.aggregate';
import { CreateEmailTemplateDto, UpdateEmailTemplateDto } from '@email-automation-engine/shared';

@Injectable()
export class EmailTemplateService {
  constructor(
    @Inject(EMAIL_TEMPLATE_REPOSITORY)
    private readonly repository: IEmailTemplateRepository,
  ) {}

  async create(tenantId: string, dto: CreateEmailTemplateDto): Promise<EmailTemplate> {
    const template = new EmailTemplate();
    template.tenantId = tenantId;
    template.name = dto.name;
    template.subject = dto.subject;
    template.html = dto.html;
    template.text = dto.text ?? null;
    return this.repository.create(template);
  }

  async findAll(tenantId: string): Promise<EmailTemplate[]> {
    return this.repository.findAll(tenantId);
  }

  async findOne(tenantId: string, id: string): Promise<EmailTemplate> {
    const template = await this.repository.findById(tenantId, id);
    if (!template) {
      throw new NotFoundException(`Email template with ID ${id} not found`);
    }
    return template;
  }

  async update(tenantId: string, id: string, dto: UpdateEmailTemplateDto): Promise<EmailTemplate> {
    const template = await this.findOne(tenantId, id);
    if (dto.name !== undefined) template.name = dto.name;
    if (dto.subject !== undefined) template.subject = dto.subject;
    if (dto.html !== undefined) template.html = dto.html;
    if (dto.text !== undefined) template.text = dto.text;
    return this.repository.update(template);
  }

  async softDelete(tenantId: string, id: string): Promise<void> {
    const template = await this.findOne(tenantId, id);
    await this.repository.softDelete(template);
  }
}

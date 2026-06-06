import type { EmailTemplate } from '../aggregates/email-template.aggregate';

export interface IEmailTemplateRepository {
  create(template: EmailTemplate): Promise<EmailTemplate>;
  findById(tenantId: string, id: string): Promise<EmailTemplate | null>;
  findAll(tenantId: string): Promise<EmailTemplate[]>;
  update(template: EmailTemplate): Promise<EmailTemplate>;
  softDelete(template: EmailTemplate): Promise<void>;
}

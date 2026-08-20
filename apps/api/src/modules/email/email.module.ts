import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { IamModule } from '../iam/iam.module';
import { EmailMessageService } from './application/services/email-message.service';
import { EmailTemplateService } from './application/services/email-template.service';
import { EMAIL_TEMPLATE_REPOSITORY } from './constants/tokens';
import { EmailEvent } from './domain/aggregates/email-event.aggregate';
import { EmailMessage } from './domain/aggregates/email-message.aggregate';
import { EmailTemplate } from './domain/aggregates/email-template.aggregate';
import { TypeOrmEmailTemplateRepository } from './infrastructure/repositories/typeorm-email-template.repository';
import { EmailTemplateController } from './interface/http/controllers/email-template.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EmailTemplate, EmailMessage, EmailEvent]), IamModule],
  controllers: [EmailTemplateController],
  providers: [
    {
      provide: EMAIL_TEMPLATE_REPOSITORY,
      useClass: TypeOrmEmailTemplateRepository,
    },
    EmailTemplateService,
    EmailMessageService,
  ],
  exports: [EmailTemplateService, EmailMessageService],
})
export class EmailModule {}

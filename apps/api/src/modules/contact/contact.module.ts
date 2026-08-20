import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { IamModule } from '../iam/iam.module';
import { ContactService } from './application/services/contact.service';
import { ContactImportService } from './application/services/contact-import.service';
import { TagService } from './application/services/tag.service';
import { CONTACT_REPOSITORY, CONTACT_TAG_REPOSITORY, TAG_REPOSITORY } from './constants/tokens';
import { Contact } from './domain/aggregates/contact.aggregate';
import { ContactTag } from './domain/aggregates/contact-tag.aggregate';
import { Tag } from './domain/aggregates/tag.aggregate';
import { TypeOrmContactRepository } from './infrastructure/repositories/typeorm-contact.repository';
import { TypeOrmContactTagRepository } from './infrastructure/repositories/typeorm-contact-tag.repository';
import { TypeOrmTagRepository } from './infrastructure/repositories/typeorm-tag.repository';
import { ContactController } from './interface/http/controllers/contact.controller';
import { TagController } from './interface/http/controllers/tag.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Contact, Tag, ContactTag]), IamModule],
  providers: [
    {
      provide: CONTACT_REPOSITORY,
      useClass: TypeOrmContactRepository,
    },
    {
      provide: TAG_REPOSITORY,
      useClass: TypeOrmTagRepository,
    },
    {
      provide: CONTACT_TAG_REPOSITORY,
      useClass: TypeOrmContactTagRepository,
    },
    ContactService,
    ContactImportService,
    TagService,
  ],
  controllers: [ContactController, TagController],
  exports: [
    CONTACT_REPOSITORY,
    TAG_REPOSITORY,
    CONTACT_TAG_REPOSITORY,
    ContactService,
    ContactImportService,
    TagService,
  ],
})
export class ContactModule {}

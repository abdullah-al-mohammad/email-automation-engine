import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from './domain/aggregates/contact.aggregate';
import { Tag } from './domain/aggregates/tag.aggregate';
import { ContactTag } from './domain/aggregates/contact-tag.aggregate';
import { TypeOrmContactRepository } from './infrastructure/repositories/typeorm-contact.repository';
import { TypeOrmTagRepository } from './infrastructure/repositories/typeorm-tag.repository';
import { TypeOrmContactTagRepository } from './infrastructure/repositories/typeorm-contact-tag.repository';
import { CONTACT_REPOSITORY, TAG_REPOSITORY, CONTACT_TAG_REPOSITORY } from './constants/tokens';
import { ContactService } from './application/services/contact.service';

@Module({
  imports: [TypeOrmModule.forFeature([Contact, Tag, ContactTag])],
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
  ],
  exports: [CONTACT_REPOSITORY, TAG_REPOSITORY, CONTACT_TAG_REPOSITORY, ContactService],
})
export class ContactModule {}

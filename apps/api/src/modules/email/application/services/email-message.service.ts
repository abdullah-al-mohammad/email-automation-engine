import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailMessage } from '../../domain/aggregates/email-message.aggregate';

@Injectable()
export class EmailMessageService {
  constructor(
    @InjectRepository(EmailMessage)
    private readonly repository: Repository<EmailMessage>,
  ) {}

  async findBySesMessageId(sesMessageId: string): Promise<EmailMessage | null> {
    return this.repository.findOne({ where: { sesMessageId } });
  }
}

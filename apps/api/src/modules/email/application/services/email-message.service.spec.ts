import 'reflect-metadata';

import type { Repository } from 'typeorm';
import type { Mocked } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EmailMessage } from '../../domain/aggregates/email-message.aggregate';
import { EmailMessageService } from './email-message.service';

describe('EmailMessageService', () => {
  let service: EmailMessageService;
  let repository: Mocked<Repository<EmailMessage>>;

  beforeEach(() => {
    repository = {
      findOne: vi.fn(),
    } as unknown as Mocked<Repository<EmailMessage>>;
    service = new EmailMessageService(repository);
  });

  describe('findBySesMessageId', () => {
    it('should return email message if found', async () => {
      const message = new EmailMessage();
      repository.findOne.mockResolvedValue(message);

      const result = await service.findBySesMessageId('ses-123');

      expect(repository.findOne).toHaveBeenCalledWith({ where: { sesMessageId: 'ses-123' } });
      expect(result).toEqual(message);
    });

    it('should return null if not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findBySesMessageId('ses-unknown');

      expect(result).toBeNull();
    });
  });
});

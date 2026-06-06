import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Mocked } from 'vitest';
import { SesWebhookController } from './ses-webhook.controller';
import type { IQueueService } from '../../../../../infrastructure/queue/queue.interface';
import type { EmailMessageService } from '../../../../email/application/services/email-message.service';
import { EmailMessage } from '../../../../email/domain/aggregates/email-message.aggregate';
import type { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

describe('SesWebhookController', () => {
  let controller: SesWebhookController;
  let queueService: Mocked<IQueueService>;
  let emailMessageService: Mocked<EmailMessageService>;
  let configService: Mocked<ConfigService>;

  beforeEach(() => {
    queueService = { sendMessage: vi.fn(), receiveMessages: vi.fn(), deleteMessage: vi.fn() } as unknown as Mocked<IQueueService>;
    emailMessageService = { findBySesMessageId: vi.fn() } as unknown as Mocked<EmailMessageService>;
    configService = { get: vi.fn().mockReturnValue('email-tracking-events') } as unknown as Mocked<ConfigService>;

    controller = new SesWebhookController(queueService, emailMessageService, configService);
    vi.spyOn(Logger, 'warn').mockImplementation(() => {});
    vi.spyOn(Logger, 'error').mockImplementation(() => {});
  });

  describe('handleSesWebhook', () => {
    it('should silently ignore payload without messageId', async () => {
      await controller.handleSesWebhook({});
      expect(emailMessageService.findBySesMessageId).not.toHaveBeenCalled();
    });

    it('should parse SNS Message string and queue tracking event', async () => {
      const emailMessage = new EmailMessage();
      emailMessage.id = 'msg-1';
      emailMessage.tenantId = 'tenant-1';
      emailMessage.contactId = 'contact-1';

      emailMessageService.findBySesMessageId.mockResolvedValue(emailMessage);

      const snsPayload = {
        Message: JSON.stringify({
          mail: { messageId: 'ses-123' },
          eventType: 'Delivery',
        }),
      };

      await controller.handleSesWebhook(snsPayload);

      expect(emailMessageService.findBySesMessageId).toHaveBeenCalledWith('ses-123');
      expect(queueService.sendMessage).toHaveBeenCalledWith(
        'email-tracking-events',
        expect.objectContaining({
          eventType: 'delivered',
          emailMessageId: 'msg-1',
          contactId: 'contact-1',
        }),
      );
    });

    it('should warn and ignore if eventType is unknown', async () => {
      await controller.handleSesWebhook({
        mail: { messageId: 'ses-123' },
        eventType: 'UnknownEvent',
      });

      expect(Logger.warn).toHaveBeenCalledWith('Unknown SES event type: UnknownEvent');
      expect(emailMessageService.findBySesMessageId).not.toHaveBeenCalled();
    });

    it('should warn and ignore if email message not found', async () => {
      emailMessageService.findBySesMessageId.mockResolvedValue(null);

      await controller.handleSesWebhook({
        mail: { messageId: 'ses-123' },
        eventType: 'Delivery',
      });

      expect(Logger.warn).toHaveBeenCalledWith('No email message found for SES messageId: ses-123');
      expect(queueService.sendMessage).not.toHaveBeenCalled();
    });
  });
});

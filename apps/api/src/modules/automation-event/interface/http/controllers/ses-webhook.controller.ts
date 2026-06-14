import { Controller, Post, Body, HttpCode, HttpStatus, Inject, Logger } from '@nestjs/common';
import { QUEUE_SERVICE, IQueueService } from '../../../../../infrastructure/queue/queue.interface';
import { EmailMessageService } from '../../../../email/application/services/email-message.service';
import { EmailTrackingEventMessage } from '@email-automation-engine/shared';
import { ConfigService } from '@nestjs/config';

import MessageValidator from 'sns-validator';

const SES_EVENT_TYPE_MAP: Record<string, EmailTrackingEventMessage['eventType']> = {
  Delivery: 'delivered',
  Bounce: 'bounced',
  Complaint: 'complained',
  Open: 'opened',
  Click: 'clicked',
};

interface SesWebhookPayload {
  mail?: { messageId?: string };
  eventType?: string;
}

interface SnsPayload {
  Type?: string;
  MessageId?: string;
  TopicArn?: string;
  Message?: string | SesWebhookPayload;
  SubscribeURL?: string;
}

const validator = new MessageValidator();

@Controller('webhooks/ses')
export class SesWebhookController {
  constructor(
    @Inject(QUEUE_SERVICE)
    private readonly queueService: IQueueService,
    private readonly emailMessageService: EmailMessageService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleSesWebhook(@Body() payload: SnsPayload): Promise<void> {
    try {
      // Validate SNS Signature
      await new Promise<void>((resolve, reject) => {
        validator.validate(payload as Record<string, unknown>, (err: Error | null) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
      // Parse SNS wrapper
      const snsMessage = payload;

      // If it's a string, it might be an unparsed body from SNS, but NestJS @Body() usually parses JSON.
      // If it's an SNS message, it has a Type field
      if (snsMessage.Type === 'SubscriptionConfirmation') {
        Logger.log(`Confirming SNS subscription for topic ${snsMessage.TopicArn}`);
        const response = await fetch(snsMessage.SubscribeURL as string);
        if (response.ok) {
          Logger.log('Successfully confirmed SNS subscription');
        } else {
          Logger.error(`Failed to confirm SNS subscription: ${response.statusText}`);
        }
        return;
      }

      if (snsMessage.Type !== 'Notification') {
        Logger.warn(`Ignoring non-notification SNS message type: ${snsMessage.Type}`);
        return;
      }

      const messageObj =
        typeof snsMessage.Message === 'string'
          ? (JSON.parse(snsMessage.Message) as SesWebhookPayload)
          : snsMessage.Message;

      const sesMessageId = messageObj?.mail?.messageId;
      const rawEventType = messageObj?.eventType;

      if (!sesMessageId || !rawEventType) {
        return;
      }

      const mappedEventType = SES_EVENT_TYPE_MAP[rawEventType];
      if (!mappedEventType) {
        Logger.warn(`Unknown SES event type: ${rawEventType}`);
        return;
      }

      // Resolve SES messageId to email_messages via ses_message_id
      const emailMessage = await this.emailMessageService.findBySesMessageId(sesMessageId);

      if (!emailMessage) {
        Logger.warn(`No email message found for SES messageId: ${sesMessageId}`);
        return;
      }

      const queueUrl =
        this.configService.get<string>('EMAIL_TRACKING_EVENTS_QUEUE_URL') ||
        'email-tracking-events';

      const trackingEvent: EmailTrackingEventMessage = {
        version: 1,
        messageId: crypto.randomUUID(),
        tenantId: emailMessage.tenantId,
        createdAt: new Date().toISOString(),
        contactId: emailMessage.contactId,
        emailMessageId: emailMessage.id,
        eventType: mappedEventType,
        occurredAt: new Date().toISOString(),
        metadata: {},
      };

      await this.queueService.sendMessage(queueUrl, trackingEvent);
    } catch (error) {
      Logger.error('Failed to process SES webhook', error);
    }
  }
}

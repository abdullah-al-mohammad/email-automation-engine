import { Controller, Post, Body, HttpCode, HttpStatus, Inject, Logger } from '@nestjs/common';
import { QUEUE_SERVICE, IQueueService } from '../../../../../infrastructure/queue/queue.interface';
import { EmailMessageService } from '../../../../email/application/services/email-message.service';
import { EmailTrackingEventMessage } from '@email-automation-engine/shared';
import { ConfigService } from '@nestjs/config';

const SES_EVENT_TYPE_MAP: Record<string, EmailTrackingEventMessage['eventType']> = {
  Delivery: 'delivered',
  Bounce: 'bounced',
  Complaint: 'complained',
  Open: 'opened',
  Click: 'clicked',
};

interface SesWebhookPayload {
  Message?: string;
  mail?: { messageId?: string };
  eventType?: string;
}

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
  async handleSesWebhook(@Body() payload: SesWebhookPayload): Promise<void> {
    try {
      // In a real scenario, this would parse SNS message formatting and confirm subscriptions
      // For this step, we just extract SES notification details
      const messageObj =
        typeof payload.Message === 'string'
          ? (JSON.parse(payload.Message) as SesWebhookPayload)
          : payload;

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

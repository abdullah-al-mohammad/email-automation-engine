import type { SqsBatchEvent, SqsBatchResponse } from '../infrastructure/queue/sqs-record.parser';
import { parseSqsRecords } from '../infrastructure/queue/sqs-record.parser';
import { isEmailTrackingEventMessage } from '@email-automation-engine/shared';
import type { EmailTrackingEventMessage } from '@email-automation-engine/shared';
import type { WorkerDeps } from './start-workflows.handler';
import { Logger } from '../infrastructure/logger/logger';

import { v7 as uuidv7 } from 'uuid';
import { workerConfig } from '../infrastructure/config/config';

export async function handler(event: SqsBatchEvent, deps: WorkerDeps): Promise<SqsBatchResponse> {
  const { dataSource, queueService } = deps;
  const { records: validRecords, failures } = parseSqsRecords<EmailTrackingEventMessage>(
    event,
    isEmailTrackingEventMessage,
  );

  for (const record of validRecords) {
    try {
      const message = record.message;
      Logger.info(
        `Processing tracking event ${message.eventType} for emailMessageId: ${message.emailMessageId}`,
      );

      // 1. Look up EmailMessage by emailMessageId
      const emailMessageRows = await dataSource.query<
        {
          id: string;
          tenant_id: string;
          contact_id: string;
          workflow_id: string;
          workflow_step_id: string;
          contact_workflow_id: string;
        }[]
      >(
        `SELECT id, tenant_id, contact_id, workflow_id, workflow_step_id, contact_workflow_id FROM email_messages WHERE id = $1`,
        [message.emailMessageId],
      );

      const emailMessage = emailMessageRows[0];
      if (!emailMessage) {
        Logger.warn(`No email message found for emailMessageId: ${message.emailMessageId}`);
        continue;
      }

      // 2. Insert EmailEvent
      await dataSource.query(
        `INSERT INTO email_events (id, tenant_id, email_message_id, contact_id, event, occurred_at) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         ON CONFLICT (email_message_id, event, occurred_at) DO NOTHING`,
        [
          uuidv7(),
          emailMessage.tenant_id,
          emailMessage.id,
          emailMessage.contact_id,
          message.eventType,
          new Date(message.occurredAt),
        ],
      );

      // 3. Update EmailMessage stats depending on eventType
      let updateQuery = '';
      const dateVal = new Date(message.occurredAt);

      switch (message.eventType) {
        case 'delivered':
          updateQuery = `UPDATE email_messages SET delivered_at = COALESCE(delivered_at, $1) WHERE id = $2`;
          break;
        case 'bounced':
          updateQuery = `UPDATE email_messages SET bounced_at = COALESCE(bounced_at, $1) WHERE id = $2`;
          break;
        case 'complained':
          updateQuery = `UPDATE email_messages SET complained_at = COALESCE(complained_at, $1) WHERE id = $2`;
          break;
        case 'opened':
          updateQuery = `UPDATE email_messages SET first_opened_at = COALESCE(first_opened_at, $1), last_opened_at = $1 WHERE id = $2`;
          break;
        case 'clicked':
          updateQuery = `UPDATE email_messages SET first_clicked_at = COALESCE(first_clicked_at, $1), last_clicked_at = $1 WHERE id = $2`;
          break;
      }

      if (updateQuery) {
        await dataSource.query(updateQuery, [dateVal, emailMessage.id]);
      }

      // 4. Emit automation event
      await queueService.sendMessage(workerConfig.AUTOMATION_EVENTS_QUEUE_URL, {
        version: 1,
        messageId: crypto.randomUUID(),
        tenantId: emailMessage.tenant_id,
        createdAt: new Date().toISOString(),
        event: `email.${message.eventType}`,
        contactId: emailMessage.contact_id,
        metadata: {
          emailMessageId: emailMessage.id,
          workflowId: emailMessage.workflow_id,
          workflowStepId: emailMessage.workflow_step_id,
          contactWorkflowId: emailMessage.contact_workflow_id,
        },
      });

      Logger.info(`Processed tracking event ${message.eventType} for ${message.emailMessageId}`);
    } catch (error) {
      Logger.error(
        `Error processing message ${record.messageId}:`,
        error instanceof Error ? error : new Error(String(error)),
      );
      failures.batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return failures;
}

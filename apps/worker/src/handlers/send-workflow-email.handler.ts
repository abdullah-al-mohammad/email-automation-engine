import type { SqsBatchEvent, SqsBatchResponse } from '../infrastructure/queue/sqs-record.parser';
import { parseSqsRecords } from '../infrastructure/queue/sqs-record.parser';
import { isEmailStepMessage } from '@email-automation-engine/shared';
import type { EmailStepMessage } from '@email-automation-engine/shared';
import type { WorkerDeps } from './start-workflows.handler';
import { Logger } from '../infrastructure/logger/logger';
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { v7 as uuidv7 } from 'uuid';
import { workerConfig } from '../infrastructure';

export async function handler(event: SqsBatchEvent, deps: WorkerDeps): Promise<SqsBatchResponse> {
  const { queueService, dataSource } = deps;
  const { records: validRecords, failures } = parseSqsRecords<EmailStepMessage>(
    event,
    isEmailStepMessage,
  );

  const ses = new SESClient({ region: workerConfig.AWS_REGION });

  for (const record of validRecords) {
    try {
      const message = record.message;
      Logger.info(`Processing send email for step: ${message.contactWorkflowStepId}`);

      // 1. Check if email is already sent
      const existing = await dataSource.query<{ id: string; status: string }[]>(
        `SELECT id, status FROM email_messages WHERE contact_workflow_step_id = $1 LIMIT 1`,
        [message.contactWorkflowStepId],
      );

      let emailMessageId: string = uuidv7();
      let isExisting = false;

      if (Array.isArray(existing) && existing.length > 0) {
        const existingRecord = existing[0];
        if (existingRecord) {
          if (existingRecord.status === 'sent') {
            Logger.info(`Email already sent for step ${message.contactWorkflowStepId}`);
            continue;
          }
          emailMessageId = existingRecord.id;
          isExisting = true;
        }
      }

      // 2. Load contact & workflow configuration
      const contactQuery = await dataSource.query<
        { email: string; subscribed: boolean; deleted_at: Date | null }[]
      >(`SELECT email, subscribed, deleted_at FROM contacts WHERE id = $1`, [message.contactId]);

      const contact = contactQuery[0];
      if (!contact || !contact.subscribed || contact.deleted_at) {
        Logger.info(`Skipping email, contact unsubscribed or deleted.`);
        continue;
      }

      // 3. Load step config and optional template
      const stepQuery = await dataSource.query<Array<{ config: Record<string, unknown> }>>(
        `SELECT config FROM workflow_steps WHERE id = $1`,
        [message.workflowStepId],
      );
      const stepConfig = stepQuery[0]?.config || {};

      let subject = typeof stepConfig.subject === 'string' ? stepConfig.subject : 'Workflow Email';
      let html = typeof stepConfig.html === 'string' ? stepConfig.html : '';
      let text = typeof stepConfig.text === 'string' ? stepConfig.text : '';
      let templateId = typeof stepConfig.templateId === 'string' ? stepConfig.templateId : null;

      if (templateId) {
        const templateQuery = await dataSource.query<
          { subject: string; html: string; text: string | null }[]
        >(`SELECT subject, html, text FROM email_templates WHERE id = $1 AND deleted_at IS NULL`, [
          templateId,
        ]);
        if (templateQuery[0]) {
          subject = templateQuery[0].subject;
          html = templateQuery[0].html;
          text = templateQuery[0].text || '';
        } else {
          Logger.warn(`Template ${templateId} not found, using config fallback`);
          templateId = null;
        }
      }

      if (!isExisting) {
        // Create EmailMessage record (status: sending)
        await dataSource.query(
          `INSERT INTO email_messages (id, tenant_id, contact_id, contact_workflow_id, contact_workflow_step_id, workflow_id, workflow_step_id, template_id, subject, status) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            emailMessageId,
            message.tenantId,
            message.contactId,
            message.contactWorkflowId,
            message.contactWorkflowStepId,
            message.workflowId,
            message.workflowStepId,
            templateId,
            subject,
            'sending',
          ],
        );
      } else {
        await dataSource.query(
          `UPDATE email_messages SET status = 'sending', subject = $1, template_id = $2 WHERE id = $3`,
          [subject, templateId, emailMessageId],
        );
      }

      // Send via SES
      const sesCommand = new SendEmailCommand({
        Source: workerConfig.FROM_EMAIL_ADDRESS,
        Destination: { ToAddresses: [contact.email] },
        Message: {
          Subject: { Data: subject },
          Body: {
            ...(html ? { Html: { Data: html } } : {}),
            ...(text
              ? { Text: { Data: text } }
              : !html
                ? { Text: { Data: 'Workflow Email' } }
                : {}),
          },
        },
      });

      const sesResponse = await ses.send(sesCommand);

      // Update EmailMessage
      await dataSource.query(
        `UPDATE email_messages SET status = 'sent', sent_at = now(), ses_message_id = $1 WHERE id = $2`,
        [sesResponse.MessageId, emailMessageId],
      );

      // 3. Send FinishedStepMessage
      await queueService.sendMessage(workerConfig.FINISHED_STEPS_QUEUE_URL, {
        version: 1,
        messageId: crypto.randomUUID(),
        tenantId: message.tenantId,
        createdAt: new Date().toISOString(),
        contactId: message.contactId,
        contactWorkflowId: message.contactWorkflowId,
        contactWorkflowStepId: message.contactWorkflowStepId,
        workflowId: message.workflowId,
        workflowStepId: message.workflowStepId,
        action: 'send_email',
      });

      Logger.info(`Sent email for step ${message.contactWorkflowStepId}`);
    } catch (error) {
      Logger.error(
        `Error processing message ${record.messageId}:`,
        error instanceof Error ? error : new Error(String(error)),
      );

      // Attempt to mark as failed if we have the step info
      try {
        await dataSource.query(
          `UPDATE email_messages SET status = 'failed' WHERE contact_workflow_step_id = $1`,
          [record.message.contactWorkflowStepId],
        );
      } catch (e) {
        Logger.error('Failed to update email_message status to failed:', e);
      }

      failures.batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return failures;
}

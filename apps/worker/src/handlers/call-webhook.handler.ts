import type { SqsBatchEvent, SqsBatchResponse } from '../infrastructure/queue/sqs-record.parser';
import { parseSqsRecords } from '../infrastructure/queue/sqs-record.parser';
import { isWebhookDeliveryMessage } from '@email-automation-engine/shared';
import type { WebhookDeliveryMessage } from '@email-automation-engine/shared';
import type { WorkerDeps } from './start-workflows.handler';
import { Logger } from '../infrastructure/logger/logger';
export async function handler(event: SqsBatchEvent, deps: WorkerDeps): Promise<SqsBatchResponse> {
  const { dataSource } = deps;
  const { records: validRecords, failures } = parseSqsRecords<WebhookDeliveryMessage>(
    event,
    isWebhookDeliveryMessage,
  );

  for (const record of validRecords) {
    try {
      const message = record.message;
      Logger.info(`Calling webhook for step: ${message.contactWorkflowStepId}`);

      // 1. Perform HTTP request (fetch API)
      let responseStatus = 500;
      let responseBody = '';

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(message.url, {
          method: message.method,
          headers: message.headers as Record<string, string>,
          body: message.body,
          signal: controller.signal,
        });

        clearTimeout(timeout);
        responseStatus = res.status;
        responseBody = await res.text();
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          responseBody = 'Webhook request timed out after 10s';
        } else {
          responseBody = err instanceof Error ? err.message : String(err);
        }
      }

      // 2. Update webhook_deliveries record
      const isSuccess = responseStatus >= 200 && responseStatus < 300;
      const status = isSuccess ? 'completed' : 'failed';

      await dataSource.query(
        `UPDATE webhook_deliveries SET response_status = $1, response_body = $2, status = $3, completed_at = now() 
         WHERE id = $4`,
        [responseStatus, responseBody, status, message.deliveryId],
      );

      if (!isSuccess) {
        throw new Error(`Webhook delivery failed with status ${responseStatus}: ${responseBody}`);
      }

      // FinishedStepMessage is sent by webhook-step.handler.ts to decouple workflow progression

      Logger.info(
        `Webhook call completed for step ${message.contactWorkflowStepId} with status ${responseStatus}`,
      );
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

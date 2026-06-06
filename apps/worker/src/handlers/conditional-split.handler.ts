import type { SqsBatchEvent, SqsBatchResponse } from '../infrastructure/queue/sqs-record.parser';
import { parseSqsRecords } from '../infrastructure/queue/sqs-record.parser';
import { isConditionalSplitMessage } from '@email-automation-engine/shared';
import type { ConditionalSplitMessage } from '@email-automation-engine/shared';
import type { WorkerDeps } from './start-workflows.handler';
import { Logger } from '../infrastructure/logger/logger';
import { workerConfig } from '../infrastructure';

export async function handler(event: SqsBatchEvent, deps: WorkerDeps): Promise<SqsBatchResponse> {
  const { queueService, dataSource } = deps;
  const { records: validRecords, failures } = parseSqsRecords<ConditionalSplitMessage>(
    event,
    isConditionalSplitMessage,
  );

  for (const record of validRecords) {
    try {
      const message = record.message;
      Logger.info(`Processing conditional split for step: ${message.contactWorkflowStepId}`);

      // 1. Load conditions from `workflow_step_conditions`
      const conditions = await dataSource.query<
        Array<{
          logical_operator: string;
          type: string;
          resource: string;
          operator: string;
          value: string;
        }>
      >(`SELECT * FROM workflow_step_conditions WHERE workflow_step_id = $1`, [
        message.workflowStepId,
      ]);

      let result = true;

      if (Array.isArray(conditions) && conditions.length > 0) {
        const logicalOp = conditions[0]?.logical_operator === 'OR' ? 'OR' : 'AND';
        const evaluations: boolean[] = [];

        const contactResult = await dataSource.query<Array<{ metadata: Record<string, unknown> }>>(
          `SELECT metadata FROM contacts WHERE id = $1`,
          [message.contactId],
        );
        const metadata = contactResult[0]?.metadata || {};

        for (const condition of conditions) {
          let conditionResult = false;

          switch (condition.type) {
            case 'tag_has': {
              const countResult = await dataSource.query<Array<{ '?column?': number }>>(
                `SELECT 1 FROM contact_tags WHERE contact_id = $1 AND tag_id = $2`,
                [message.contactId, condition.resource],
              );
              conditionResult = countResult.length > 0;
              break;
            }
            case 'tag_missing': {
              const countResult = await dataSource.query<Array<{ '?column?': number }>>(
                `SELECT 1 FROM contact_tags WHERE contact_id = $1 AND tag_id = $2`,
                [message.contactId, condition.resource],
              );
              conditionResult = countResult.length === 0;
              break;
            }
            case 'contact_field': {
              const rawValue = metadata[condition.resource];
              const fieldValue = typeof rawValue === 'string' ? rawValue : '';
              if (condition.operator === 'equals')
                conditionResult = String(fieldValue) === String(condition.value);
              else if (condition.operator === 'not_equals')
                conditionResult = String(fieldValue) !== String(condition.value);
              else if (condition.operator === 'contains')
                conditionResult = String(fieldValue).includes(String(condition.value));
              break;
            }
            case 'email_opened': {
              const emailCount = await dataSource.query<Array<{ '?column?': number }>>(
                `SELECT 1 FROM email_events WHERE contact_id = $1 AND event = 'opened'`,
                [message.contactId],
              );
              conditionResult = emailCount.length > 0;
              break;
            }
            case 'email_clicked': {
              const clickCount = await dataSource.query<Array<{ '?column?': number }>>(
                `SELECT 1 FROM email_events WHERE contact_id = $1 AND event = 'clicked'`,
                [message.contactId],
              );
              conditionResult = clickCount.length > 0;
              break;
            }
          }

          evaluations.push(conditionResult);
        }

        result = logicalOp === 'OR' ? evaluations.some((r) => r) : evaluations.every((r) => r);
      }

      // 2. Send FinishedStepMessage to FINISHED_STEPS_QUEUE_URL
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
        action: 'conditional_split',
        conditionalSplitResult: result,
      });

      Logger.info(
        `Completed conditional split for step ${message.contactWorkflowStepId} with result ${result}`,
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

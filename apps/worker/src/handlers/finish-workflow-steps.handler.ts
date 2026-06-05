import type { SqsBatchEvent, SqsBatchResponse } from '../infrastructure/queue/sqs-record.parser';
import { parseSqsRecords } from '../infrastructure/queue/sqs-record.parser';
import { isFinishedStepMessage } from '@email-automation-engine/shared';
import type { FinishedStepMessage } from '@email-automation-engine/shared';
import type { QueueService } from '../infrastructure/queue/queue.interface';
import type { CacheService } from '../infrastructure/cache/cache.interface';
import type { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { Logger } from '../infrastructure/logger/logger';

export interface WorkerDeps {
  queueService: QueueService;
  cacheService: CacheService;
  dataSource: DataSource;
}

export async function handler(event: SqsBatchEvent, deps: WorkerDeps): Promise<SqsBatchResponse> {
  const { queueService, dataSource } = deps;
  const { records: validRecords, failures } = parseSqsRecords<FinishedStepMessage>(
    event,
    isFinishedStepMessage,
  );

  const batchItemFailures = [...failures.batchItemFailures];

  for (const record of validRecords) {
    const message = record.message;

    try {
      const cwSteps = await dataSource.query<Array<{ id: string; status: string }>>(
        `SELECT id, status FROM contact_workflow_steps WHERE contact_workflow_id = $1 AND workflow_step_id = $2`,
        [message.contactWorkflowId, message.workflowStepId],
      );
      if (cwSteps.length === 0 || !cwSteps[0] || cwSteps[0].status === 'finished') {
        continue;
      }
      const cwStepId = cwSteps[0].id;

      await dataSource.query(
        `UPDATE contact_workflow_steps SET status = 'finished', finished_at = now(), error = COALESCE($1, error), updated_at = now() WHERE id = $2`,
        [message.error || null, cwStepId],
      );

      const currentSteps = await dataSource.query<
        Array<{
          id: string;
          action: string;
          true_step_id: string;
          false_step_id: string;
        }>
      >(`SELECT id, action, true_step_id, false_step_id FROM workflow_steps WHERE id = $1`, [
        message.workflowStepId,
      ]);
      if (currentSteps.length === 0 || !currentSteps[0]) continue;
      const currentStep = currentSteps[0];

      let nextStepId: string | null = null;
      if (currentStep.action === 'conditional_split' && message.conditionalSplitResult) {
        nextStepId =
          message.conditionalSplitResult === 'true'
            ? currentStep.true_step_id
            : currentStep.false_step_id;
      } else {
        const nextSteps = await dataSource.query<Array<{ id: string }>>(
          `SELECT id FROM workflow_steps WHERE workflow_id = $1 AND parent_workflow_step_id = $2 LIMIT 1`,
          [message.workflowId, currentStep.id],
        );
        if (nextSteps.length > 0 && nextSteps[0]) {
          nextStepId = nextSteps[0].id;
        }
      }

      const exitConditions = await dataSource.query<Array<{ type: string; resource: string }>>(
        `SELECT type, resource FROM workflow_exit_conditions WHERE workflow_id = $1`,
        [message.workflowId],
      );

      let shouldExit = false;
      if (exitConditions.length > 0) {
        const contacts = await dataSource.query<Array<{ subscribed: boolean }>>(
          `SELECT subscribed FROM contacts WHERE id = $1`,
          [message.contactId],
        );
        const contact = contacts[0];

        if (!contact) {
          shouldExit = true;
        } else {
          const tags = await dataSource.query<Array<{ tag_id: string }>>(
            `SELECT tag_id FROM contact_tags WHERE contact_id = $1`,
            [message.contactId],
          );
          const tagIds = new Set(tags.map((t) => t.tag_id));

          for (const ec of exitConditions) {
            if (ec.type === 'contact_unsubscribed' && !contact.subscribed) {
              shouldExit = true;
              break;
            }
            if (ec.type === 'tag_added' && tagIds.has(ec.resource)) {
              shouldExit = true;
              break;
            }
            if (ec.type === 'tag_removed' && !tagIds.has(ec.resource)) {
              shouldExit = true;
              break;
            }
          }
        }
      }

      if (shouldExit || !nextStepId) {
        await dataSource.query(
          `UPDATE contact_workflows SET status = 'finished', finished_at = now(), updated_at = now() WHERE id = $1`,
          [message.contactWorkflowId],
        );
      } else {
        const nextStepsFull = await dataSource.query<Array<{ action: string }>>(
          `SELECT action FROM workflow_steps WHERE id = $1`,
          [nextStepId],
        );
        if (nextStepsFull.length > 0 && nextStepsFull[0]) {
          const waitingUrl =
            process.env.WAITING_STEPS_QUEUE_URL || 'waiting-contact-workflow-steps';
          await queueService.sendMessage(waitingUrl, {
            version: 1,
            messageId: randomUUID(),
            tenantId: message.tenantId,
            createdAt: new Date().toISOString(),
            contactId: message.contactId,
            contactWorkflowId: message.contactWorkflowId,
            workflowId: message.workflowId,
            workflowStepId: nextStepId,
            action: nextStepsFull[0].action,
          });
        }
      }
    } catch (err) {
      Logger.error(`Failed to process finish-workflow-steps for record ${record.messageId}`, err);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
}

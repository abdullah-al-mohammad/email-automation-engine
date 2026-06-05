import type { SqsBatchEvent, SqsBatchResponse } from '../infrastructure/queue/sqs-record.parser';
import { parseSqsRecords } from '../infrastructure/queue/sqs-record.parser';
import { isAutomationEventMessage } from '@email-automation-engine/shared';
import type { AutomationEventMessage } from '@email-automation-engine/shared';
import type { QueueService } from '../infrastructure/queue/queue.interface';
import type { CacheService } from '../infrastructure/cache/cache.interface';
import type { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { v7 as uuidv7 } from 'uuid';
import { Logger } from '../infrastructure/logger/logger';
import { workerConfig } from '../infrastructure';

export interface WorkerDeps {
  queueService: QueueService;
  cacheService: CacheService;
  dataSource: DataSource;
}

export async function handler(event: SqsBatchEvent, deps: WorkerDeps): Promise<SqsBatchResponse> {
  const { queueService, dataSource } = deps;
  const { records: validRecords, failures } = parseSqsRecords<AutomationEventMessage>(
    event,
    isAutomationEventMessage,
  );

  const batchItemFailures = [...failures.batchItemFailures];

  for (const record of validRecords) {
    const message = record.message;

    try {
      for (const workflowId of message.matchedWorkflowIds) {
        await dataSource.transaction(async (manager) => {
          // Find workflow, ensure active
          const workflows = await manager.query<Array<{ id: string; is_active: boolean }>>(
            `SELECT id, is_active FROM workflows WHERE id = $1 AND tenant_id = $2`,
            [workflowId, message.tenantId],
          );
          if (workflows.length === 0 || !workflows[0]?.is_active) {
            return; // Skip inactive
          }

          // Find contact, ensure not deleted
          // Use FOR UPDATE to lock the contact row and prevent dedup race conditions across concurrent invocations
          const contacts = await manager.query<Array<{ id: string }>>(
            `SELECT id FROM contacts WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL FOR UPDATE`,
            [message.contactId, message.tenantId],
          );
          if (contacts.length === 0) {
            return; // Skip deleted/missing contact
          }

          // Get first step (root step has no parent)
          const steps = await manager.query<Array<{ id: string; action: string }>>(
            `SELECT id, action FROM workflow_steps WHERE workflow_id = $1 AND parent_workflow_step_id IS NULL LIMIT 1`,
            [workflowId],
          );
          if (steps.length === 0 || !steps[0]) {
            return; // Malformed workflow
          }
          const firstStep = steps[0];

          // Match the specific trigger id if possible
          const triggerId =
            message.matchedTriggerIds.length > 0 ? message.matchedTriggerIds[0] : null;

          // Insert contact_workflows with dedup check using CTE
          const newContactWorkflowId = uuidv7();
          const insertRes = await manager.query<Array<{ id: string }>>(
            `INSERT INTO contact_workflows (id, tenant_id, workflow_id, workflow_trigger_id, contact_id, status, trigger_event, created_at, updated_at)
             SELECT $1, $2, $3, $4, $5, 'pending', $6, now(), now()
             WHERE NOT EXISTS (
               SELECT 1 FROM contact_workflows 
               WHERE contact_id = $5 AND workflow_id = $3 AND status NOT IN ('finished', 'error')
             )
             RETURNING id`,
            [
              newContactWorkflowId,
              message.tenantId,
              workflowId,
              triggerId,
              message.contactId,
              message.event,
            ],
          );

          if (insertRes.length === 0 || !insertRes[0]) {
            return; // Dedup
          }
          const contactWorkflowId = insertRes[0].id;

          // Enqueue to waiting-contact-workflow-steps
          const waitingUrl = workerConfig.WAITING_STEPS_QUEUE_URL;
          await queueService.sendMessage(waitingUrl, {
            version: 1,
            messageId: randomUUID(),
            tenantId: message.tenantId,
            createdAt: new Date().toISOString(),
            contactId: message.contactId,
            contactWorkflowId,
            workflowId,
            workflowStepId: firstStep.id,
            action: firstStep.action,
          });
        });
      }
    } catch (err) {
      Logger.error(`Failed to process start-workflow for record ${record.messageId}`, err);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
}

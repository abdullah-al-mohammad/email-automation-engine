import type { SqsBatchEvent, SqsBatchResponse } from '../infrastructure/queue/sqs-record.parser';
import { parseSqsRecords } from '../infrastructure/queue/sqs-record.parser';
import { isAutomationEventMessage } from '@email-automation-engine/shared';
import type { AutomationEventMessage } from '@email-automation-engine/shared';
import type { QueueService } from '../infrastructure/queue/queue.interface';
import type { CacheService } from '../infrastructure/cache/cache.interface';
import type { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';

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
        // Find workflow, ensure active
        const workflows = await dataSource.query<Array<{ id: string; is_active: boolean }>>(
          `SELECT id, is_active FROM workflows WHERE id = $1 AND tenant_id = $2`,
          [workflowId, message.tenantId],
        );
        if (workflows.length === 0 || !workflows[0]?.is_active) {
          continue; // Skip inactive
        }

        // Find contact, ensure not deleted
        const contacts = await dataSource.query<Array<{ id: string }>>(
          `SELECT id FROM contacts WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
          [message.contactId, message.tenantId],
        );
        if (contacts.length === 0) {
          continue; // Skip deleted/missing contact
        }

        // Get first step
        const steps = await dataSource.query<Array<{ id: string; action: string }>>(
          `SELECT id, action FROM workflow_steps WHERE workflow_id = $1 ORDER BY position ASC LIMIT 1`,
          [workflowId],
        );
        if (steps.length === 0 || !steps[0]) {
          continue; // Malformed workflow
        }
        const firstStep = steps[0];

        // Match the specific trigger id if possible
        const triggerId =
          message.matchedTriggerIds.length > 0 ? message.matchedTriggerIds[0] : null;

        // Insert contact_workflows with dedup check using CTE
        const insertRes = await dataSource.query<Array<{ id: string }>>(
          `INSERT INTO contact_workflows (tenant_id, workflow_id, workflow_trigger_id, contact_id, status, trigger_event, created_at, updated_at)
           SELECT $1, $2, $3, $4, 'pending', $5, now(), now()
           WHERE NOT EXISTS (
             SELECT 1 FROM contact_workflows 
             WHERE contact_id = $4 AND workflow_id = $2 AND status NOT IN ('finished', 'error')
           )
           RETURNING id`,
          [message.tenantId, workflowId, triggerId, message.contactId, message.event],
        );

        if (insertRes.length === 0 || !insertRes[0]) {
          continue; // Dedup
        }
        const contactWorkflowId = insertRes[0].id;

        // Enqueue to waiting-contact-workflow-steps
        const waitingUrl = process.env.WAITING_STEPS_QUEUE_URL || 'waiting-contact-workflow-steps';
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
      }
    } catch (err) {
      console.error(`Failed to process start-workflow for record ${record.messageId}`, err);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
}

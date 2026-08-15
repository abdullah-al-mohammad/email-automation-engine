import type { WaitingStepMessage } from '@email-automation-engine/shared';
import { isWaitingStepMessage } from '@email-automation-engine/shared';
import { STEP_ACTIONS } from '@email-automation-engine/shared';
import { randomUUID } from 'crypto';
import { v7 as uuidv7 } from 'uuid';

import { workerConfig } from '../infrastructure';
import { Logger } from '../infrastructure/logger/logger';
import type { SqsBatchEvent, SqsBatchResponse } from '../infrastructure/queue/sqs-record.parser';
import { parseSqsRecords } from '../infrastructure/queue/sqs-record.parser';
import type { WorkerDeps } from './start-workflows.handler';

export async function handler(event: SqsBatchEvent, deps: WorkerDeps): Promise<SqsBatchResponse> {
  const { records: validRecords, failures } = parseSqsRecords<WaitingStepMessage>(
    event,
    isWaitingStepMessage,
  );

  const batchItemFailures = [...failures.batchItemFailures];

  await Promise.all(
    validRecords.map(async (record) => {
      try {
        await processStartWorkflowStep(record.message, deps);
      } catch (error) {
        Logger.error(
          `Failed to process start-workflow-steps for record ${record.messageId}`,
          error,
        );
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    }),
  );

  return { batchItemFailures };
}

async function processStartWorkflowStep(
  message: WaitingStepMessage,
  deps: WorkerDeps,
): Promise<void> {
  const { queueService, dataSource } = deps;
  const cws = await dataSource.query<Array<{ id: string; status: string }>>(
    `SELECT id, status FROM contact_workflows WHERE id = $1`,
    [message.contactWorkflowId],
  );
  if (cws.length === 0 || !cws[0] || cws[0].status === 'finished' || cws[0].status === 'error') {
    return;
  }

  const newStepId = uuidv7();
  const stepInsert = await dataSource.query<Array<{ id: string }>>(
    `
  INSERT INTO contact_workflow_steps (id, tenant_id, contact_workflow_id, workflow_step_id, status, created_at, updated_at)
  VALUES ($1, $2, $3, $4, 'pending', now(), now())
  ON CONFLICT (contact_workflow_id, workflow_step_id) WHERE status != 'finished' DO NOTHING
  RETURNING id
`,
    [newStepId, message.tenantId, message.contactWorkflowId, message.workflowStepId],
  );

  let stepId: string;
  if (stepInsert.length > 0 && stepInsert[0]) {
    stepId = stepInsert[0].id;
  } else {
    const existingSteps = await dataSource.query<Array<{ id: string }>>(
      `SELECT id, status FROM contact_workflow_steps WHERE contact_workflow_id = $1 AND workflow_step_id = $2 AND status != 'finished'`,
      [message.contactWorkflowId, message.workflowStepId],
    );
    if (existingSteps.length === 0 || !existingSteps[0]) {
      return;
    }
    stepId = existingSteps[0].id;
  }

  if (cws[0]?.status === 'pending') {
    await dataSource.query(
      `UPDATE contact_workflows SET status = 'in_progress', started_at = COALESCE(started_at, now()), updated_at = now() WHERE id = $1`,
      [message.contactWorkflowId],
    );
  }

  const steps = await dataSource.query<
    Array<{
      config: {
        amount?: number;
        unit?: string;
        tagId?: string;
        templateId?: string;
        subject?: string;
        url?: string;
        method?: string;
        headers?: Record<string, string>;
        body?: string;
      };
    }>
  >(`SELECT config FROM workflow_steps WHERE id = $1`, [message.workflowStepId]);
  if (steps.length === 0 || !steps[0]) return;
  const config = steps[0].config || {};

  let enqueueFinish = false;

  switch (message.action) {
    case STEP_ACTIONS.DELAY: {
      const currentStepRecord = await dataSource.query<Array<{ scheduled_at: Date | null }>>(
        `SELECT scheduled_at FROM contact_workflow_steps WHERE id = $1`,
        [stepId],
      );
      if (
        currentStepRecord.length > 0 &&
        currentStepRecord[0]?.scheduled_at &&
        new Date(currentStepRecord[0].scheduled_at) <= new Date()
      ) {
        enqueueFinish = true;
      } else {
        const amount = config.amount || 1;
        const unit = config.unit || 'days';
        const interval = `${amount} ${unit}`;

        await dataSource.query(
          `UPDATE contact_workflow_steps SET status = 'scheduled', scheduled_at = now() + $1::interval, updated_at = now() WHERE id = $2`,
          [interval, stepId],
        );
      }
      break;
    }
    case STEP_ACTIONS.ATTACH_TAG: {
      if (config.tagId) {
        await dataSource.query(
          `INSERT INTO contact_tags (contact_id, tag_id, created_at) VALUES ($1, $2, now()) ON CONFLICT DO NOTHING`,
          [message.contactId, config.tagId],
        );
      }
      enqueueFinish = true;
      break;
    }
    case STEP_ACTIONS.DETACH_TAG: {
      if (config.tagId) {
        await dataSource.query(`DELETE FROM contact_tags WHERE contact_id = $1 AND tag_id = $2`, [
          message.contactId,
          config.tagId,
        ]);
      }
      enqueueFinish = true;
      break;
    }
    case STEP_ACTIONS.UNSUBSCRIBE_CONTACT: {
      await dataSource.query(
        `UPDATE contacts SET subscribed = false, updated_at = now() WHERE id = $1`,
        [message.contactId],
      );
      enqueueFinish = true;
      break;
    }
    case STEP_ACTIONS.DELETE_CONTACT: {
      await dataSource.query(
        `UPDATE contacts SET deleted_at = now(), updated_at = now() WHERE id = $1`,
        [message.contactId],
      );
      enqueueFinish = true;
      break;
    }
    case STEP_ACTIONS.SEND_EMAIL: {
      const queueUrl = workerConfig.WORKFLOW_EMAILS_QUEUE_URL;
      const outMsg = { ...message, contactWorkflowStepId: stepId };
      await queueService.sendMessage(queueUrl, outMsg, {
        messageGroupId: message.contactWorkflowId,
        messageDeduplicationId: message.messageId,
      });
      break;
    }
    case STEP_ACTIONS.CONDITIONAL_SPLIT: {
      const queueUrl = workerConfig.CONDITIONAL_SPLIT_QUEUE_URL;
      const outMsg = { ...message, contactWorkflowStepId: stepId };
      await queueService.sendMessage(queueUrl, outMsg, {
        messageGroupId: message.contactWorkflowId,
        messageDeduplicationId: message.messageId,
      });
      break;
    }
    case STEP_ACTIONS.WEBHOOK: {
      const queueUrl = workerConfig.WEBHOOK_STEPS_QUEUE_URL;
      const outMsg = { ...message, contactWorkflowStepId: stepId };
      await queueService.sendMessage(queueUrl, outMsg, {
        messageGroupId: message.contactWorkflowId,
        messageDeduplicationId: message.messageId,
      });
      break;
    }
  }

  if (enqueueFinish) {
    const finishUrl = workerConfig.FINISHED_STEPS_QUEUE_URL;
    await queueService.sendMessage(finishUrl, {
      version: 1,
      messageId: randomUUID(),
      tenantId: message.tenantId,
      createdAt: new Date().toISOString(),
      contactId: message.contactId,
      contactWorkflowId: message.contactWorkflowId,
      workflowId: message.workflowId,
      workflowStepId: message.workflowStepId,
      contactWorkflowStepId: stepId,
      action: message.action,
    });
  }
}

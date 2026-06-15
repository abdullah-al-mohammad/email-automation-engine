import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DataSource } from 'typeorm';
import { handler as startWorkflowStepsHandler } from './start-workflow-steps.handler';
import { workerConfig } from '../infrastructure/config/config';
import { STEP_ACTIONS } from '@email-automation-engine/shared';
import { v7 as uuidv7 } from 'uuid';
import type { CacheService } from '../infrastructure/cache/cache.interface';
import type { SqsBatchEvent } from '../infrastructure/queue/sqs-record.parser';

describe('Worker Integration Tests', () => {
  let dataSource: DataSource;
  let tenantId: string;
  let userId: string;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      url: workerConfig.DATABASE_URL,
    });
    await dataSource.initialize();
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.query(`DELETE FROM contact_workflow_steps WHERE tenant_id = $1`, [tenantId]);
      await dataSource.query(`DELETE FROM contact_workflows WHERE tenant_id = $1`, [tenantId]);
      await dataSource.query(`DELETE FROM workflow_steps WHERE tenant_id = $1`, [tenantId]);
      await dataSource.query(`DELETE FROM workflows WHERE tenant_id = $1`, [tenantId]);
      await dataSource.query(`DELETE FROM contacts WHERE tenant_id = $1`, [tenantId]);
      await dataSource.query(`DELETE FROM tags WHERE tenant_id = $1`, [tenantId]);
      await dataSource.query(`DELETE FROM tenants WHERE id = $1`, [tenantId]);
      await dataSource.query(`DELETE FROM users WHERE id = $1`, [userId]);
      await dataSource.destroy();
    }
  });

  it('should process a start-workflow-steps event using real DB', async () => {
    // Insert test data
    tenantId = uuidv7();
    const workflowId = uuidv7();
    const contactId = uuidv7();
    const contactWorkflowId = uuidv7();
    const workflowStepId = uuidv7();

    // 1. Insert User (creator)
    userId = uuidv7();
    await dataSource.query(`INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'hash')`, [
      userId,
      `test-${userId}@example.com`,
    ]);

    // 2. Insert Tenant
    await dataSource.query(
      `INSERT INTO tenants (id, name, creator_id) VALUES ($1, 'Test Tenant', $2)`,
      [tenantId, userId],
    );

    // 3. Insert Workflow
    await dataSource.query(
      `INSERT INTO workflows (id, tenant_id, name, status) VALUES ($1, $2, 'Test WF', 'active')`,
      [workflowId, tenantId],
    );

    // 4. Insert Contact
    await dataSource.query(
      `INSERT INTO contacts (id, tenant_id, email, subscribed) VALUES ($1, $2, $3, true)`,
      [contactId, tenantId, `contact-${contactId}@example.com`],
    );

    // 5. Insert ContactWorkflow
    await dataSource.query(
      `INSERT INTO contact_workflows (id, tenant_id, workflow_id, contact_id, status, trigger_event) VALUES ($1, $2, $3, $4, 'pending', 'api_event')`,
      [contactWorkflowId, tenantId, workflowId, contactId],
    );

    const tagId = uuidv7();

    // Insert Tag
    await dataSource.query(`INSERT INTO tags (id, tenant_id, name) VALUES ($1, $2, 'Test Tag')`, [
      tagId,
      tenantId,
    ]);

    // 6. Insert WorkflowStep
    await dataSource.query(
      `INSERT INTO workflow_steps (id, tenant_id, workflow_id, action, config) VALUES ($1, $2, $3, $4, $5)`,
      [workflowStepId, tenantId, workflowId, STEP_ACTIONS.ATTACH_TAG, JSON.stringify({ tagId })],
    );

    const event = {
      Records: [
        {
          messageId: 'test-msg-1',
          receiptHandle: 'handle-1',
          body: JSON.stringify({
            version: 1,
            messageId: uuidv7(),
            tenantId,
            contactId,
            contactWorkflowId,
            workflowId,
            workflowStepId,
            action: STEP_ACTIONS.ATTACH_TAG,
            createdAt: new Date().toISOString(),
          }),
        },
      ],
    };

    const mockQueueService = {
      sendMessage: async () => {},
      sendMessages: async () => ({ successfulIds: [], failedIds: [] }),
    };

    const deps = {
      queueService: mockQueueService,
      cacheService: {} as unknown as CacheService,
      dataSource,
    };

    // Run handler
    const response = await startWorkflowStepsHandler(event as unknown as SqsBatchEvent, deps);

    // Expect no batch item failures
    expect(response.batchItemFailures).toHaveLength(0);

    // Verify contact_workflows status is updated to 'in_progress'
    const cw = await dataSource.query(`SELECT status FROM contact_workflows WHERE id = $1`, [
      contactWorkflowId,
    ]);
    expect(cw[0].status).toBe('in_progress');

    // Verify contact_workflow_steps was created
    const cws = await dataSource.query(
      `SELECT status FROM contact_workflow_steps WHERE contact_workflow_id = $1`,
      [contactWorkflowId],
    );
    expect(cws.length).toBe(1);
  });
});

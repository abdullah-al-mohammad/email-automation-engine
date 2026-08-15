import { STEP_ACTIONS } from '@email-automation-engine/shared';
import { DataSource } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import type { CacheService } from '../infrastructure/cache/cache.interface';
import { workerConfig } from '../infrastructure/config/config';
import type { SqsBatchEvent } from '../infrastructure/queue/sqs-record.parser';
import { handler as conditionalSplitHandler } from './conditional-split.handler';
import { handler as startWorkflowStepsHandler } from './start-workflow-steps.handler';
import { handler as startWorkflowsHandler } from './start-workflows.handler';

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

  it('should process a conditional-split event using real DB', async () => {
    // 1. Create unique identifiers
    const tempTenantId = uuidv7();
    const tempWorkflowId = uuidv7();
    const tempContactId = uuidv7();
    const tempContactWorkflowId = uuidv7();
    const tempWorkflowStepId = uuidv7();
    const tempContactWorkflowStepId = uuidv7();
    const tempConditionId = uuidv7();

    try {
      // 2. Insert minimal schema records
      await dataSource.query(
        `INSERT INTO tenants (id, name, creator_id) VALUES ($1, 'Temp Tenant', $2)`,
        [tempTenantId, userId],
      );
      await dataSource.query(
        `INSERT INTO workflows (id, tenant_id, name, status) VALUES ($1, $2, 'Temp WF', 'active')`,
        [tempWorkflowId, tempTenantId],
      );
      await dataSource.query(
        `INSERT INTO contacts (id, tenant_id, email, subscribed, metadata) VALUES ($1, $2, $3, true, $4)`,
        [
          tempContactId,
          tempTenantId,
          `temp-${tempContactId}@example.com`,
          JSON.stringify({ role: 'admin' }),
        ],
      );
      await dataSource.query(
        `INSERT INTO contact_workflows (id, tenant_id, workflow_id, contact_id, status, trigger_event) VALUES ($1, $2, $3, $4, 'in_progress', 'api_event')`,
        [tempContactWorkflowId, tempTenantId, tempWorkflowId, tempContactId],
      );
      await dataSource.query(
        `INSERT INTO workflow_steps (id, tenant_id, workflow_id, action) VALUES ($1, $2, $3, $4)`,
        [tempWorkflowStepId, tempTenantId, tempWorkflowId, STEP_ACTIONS.CONDITIONAL_SPLIT],
      );
      await dataSource.query(
        `INSERT INTO contact_workflow_steps (id, tenant_id, contact_workflow_id, workflow_step_id, status) VALUES ($1, $2, $3, $4, 'running')`,
        [tempContactWorkflowStepId, tempTenantId, tempContactWorkflowId, tempWorkflowStepId],
      );

      // Insert conditional split conditions
      await dataSource.query(
        `INSERT INTO workflow_step_conditions (id, tenant_id, workflow_id, workflow_step_id, type, resource, operator, value, logical_operator) VALUES ($1, $2, $3, $4, 'contact_field', 'role', 'equals', 'admin', 'ALL')`,
        [tempConditionId, tempTenantId, tempWorkflowId, tempWorkflowStepId],
      );

      // 3. Setup event payload and mocked dependencies
      const event = {
        Records: [
          {
            messageId: 'temp-msg-1',
            receiptHandle: 'temp-handle-1',
            body: JSON.stringify({
              version: 1,
              messageId: uuidv7(),
              tenantId: tempTenantId,
              contactId: tempContactId,
              contactWorkflowId: tempContactWorkflowId,
              contactWorkflowStepId: tempContactWorkflowStepId,
              workflowId: tempWorkflowId,
              workflowStepId: tempWorkflowStepId,
              action: STEP_ACTIONS.CONDITIONAL_SPLIT,
              createdAt: new Date().toISOString(),
            }),
          },
        ],
      };

      const mockQueueService = {
        sendMessage: vi.fn(),
        sendMessages: vi.fn(),
      };

      const deps = {
        queueService: mockQueueService,
        cacheService: {} as unknown as CacheService,
        dataSource,
      };

      // 4. Run handler
      const response = await conditionalSplitHandler(event as unknown as SqsBatchEvent, deps);

      // Expect no batch item failures
      expect(response.batchItemFailures).toHaveLength(0);

      // Expect step finished message sent with conditionalSplitResult: true
      expect(deps.queueService.sendMessage).toHaveBeenCalledWith(
        workerConfig.FINISHED_STEPS_QUEUE_URL,
        expect.objectContaining({
          conditionalSplitResult: true,
        }),
      );
    } finally {
      // 5. Clean up temporary records in reverse dependency order
      await dataSource.query(`DELETE FROM workflow_step_conditions WHERE id = $1`, [
        tempConditionId,
      ]);
      await dataSource.query(`DELETE FROM contact_workflow_steps WHERE id = $1`, [
        tempContactWorkflowStepId,
      ]);
      await dataSource.query(`DELETE FROM workflow_steps WHERE id = $1`, [tempWorkflowStepId]);
      await dataSource.query(`DELETE FROM contact_workflows WHERE id = $1`, [
        tempContactWorkflowId,
      ]);
      await dataSource.query(`DELETE FROM contacts WHERE id = $1`, [tempContactId]);
      await dataSource.query(`DELETE FROM workflows WHERE id = $1`, [tempWorkflowId]);
      await dataSource.query(`DELETE FROM tenants WHERE id = $1`, [tempTenantId]);
    }
  });

  it('should process a start-workflows event and initialize workflow execution', async () => {
    const tempTenantId = uuidv7();
    const tempWorkflowId = uuidv7();
    const tempContactId = uuidv7();
    const tempTriggerId = uuidv7();
    const tempWorkflowStepId = uuidv7();
    let tempContactWorkflowId: string | null = null;

    try {
      // 1. Insert minimal schema records
      await dataSource.query(
        `INSERT INTO tenants (id, name, creator_id) VALUES ($1, 'Temp Tenant 2', $2)`,
        [tempTenantId, userId],
      );
      await dataSource.query(
        `INSERT INTO workflows (id, tenant_id, name, status, is_active) VALUES ($1, $2, 'Temp WF 2', 'active', true)`,
        [tempWorkflowId, tempTenantId],
      );
      await dataSource.query(
        `INSERT INTO contacts (id, tenant_id, email, subscribed) VALUES ($1, $2, $3, true)`,
        [tempContactId, tempTenantId, `temp2-${tempContactId}@example.com`],
      );
      await dataSource.query(
        `INSERT INTO workflow_triggers (id, tenant_id, workflow_id, event) VALUES ($1, $2, $3, 'custom.event')`,
        [tempTriggerId, tempTenantId, tempWorkflowId],
      );
      await dataSource.query(
        `INSERT INTO workflow_steps (id, tenant_id, workflow_id, action) VALUES ($1, $2, $3, $4)`,
        [tempWorkflowStepId, tempTenantId, tempWorkflowId, STEP_ACTIONS.ATTACH_TAG],
      );

      // 2. Setup event payload and mocked dependencies
      const event = {
        Records: [
          {
            messageId: 'temp-msg-2',
            receiptHandle: 'temp-handle-2',
            body: JSON.stringify({
              version: 1,
              messageId: uuidv7(),
              tenantId: tempTenantId,
              contactId: tempContactId,
              event: 'custom.event',
              matchedWorkflowIds: [tempWorkflowId],
              matchedTriggerIds: [tempTriggerId],
              occurredAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            }),
          },
        ],
      };

      const mockQueueService = {
        sendMessage: vi.fn(),
        sendMessages: vi.fn(),
      };

      const deps = {
        queueService: mockQueueService,
        cacheService: {} as unknown as CacheService,
        dataSource,
      };

      // 3. Run handler
      const response = await startWorkflowsHandler(event as unknown as SqsBatchEvent, deps);

      // Expect no batch item failures
      expect(response.batchItemFailures).toHaveLength(0);

      // Verify contact_workflows row was created
      const cw = await dataSource.query<Array<{ id: string; status: string }>>(
        `SELECT id, status FROM contact_workflows WHERE tenant_id = $1 AND workflow_id = $2 AND contact_id = $3`,
        [tempTenantId, tempWorkflowId, tempContactId],
      );
      expect(cw).toHaveLength(1);
      expect(cw[0].status).toBe('pending');
      tempContactWorkflowId = cw[0].id;

      // Expect waiting-contact-workflow-steps message sent
      expect(deps.queueService.sendMessage).toHaveBeenCalledWith(
        workerConfig.WAITING_STEPS_QUEUE_URL,
        expect.objectContaining({
          contactWorkflowId: tempContactWorkflowId,
          workflowStepId: tempWorkflowStepId,
          action: STEP_ACTIONS.ATTACH_TAG,
        }),
      );
    } finally {
      // 4. Clean up temporary records
      if (tempContactWorkflowId) {
        await dataSource.query(`DELETE FROM contact_workflows WHERE id = $1`, [
          tempContactWorkflowId,
        ]);
      }
      await dataSource.query(`DELETE FROM workflow_steps WHERE id = $1`, [tempWorkflowStepId]);
      await dataSource.query(`DELETE FROM workflow_triggers WHERE id = $1`, [tempTriggerId]);
      await dataSource.query(`DELETE FROM contacts WHERE id = $1`, [tempContactId]);
      await dataSource.query(`DELETE FROM workflows WHERE id = $1`, [tempWorkflowId]);
      await dataSource.query(`DELETE FROM tenants WHERE id = $1`, [tempTenantId]);
    }
  });
});

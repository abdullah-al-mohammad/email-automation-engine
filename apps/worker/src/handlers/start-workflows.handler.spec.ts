import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from './start-workflows.handler';
import type { SqsBatchEvent } from '../infrastructure/queue/sqs-record.parser';
import type { Mocked } from 'vitest';
import type { DataSource } from 'typeorm';
import type { QueueService } from '../infrastructure/queue/queue.interface';
import type { CacheService } from '../infrastructure/cache/cache.interface';

describe('start-workflows.handler', () => {
  let queueService: Mocked<QueueService>;
  let dataSource: Mocked<DataSource>;

  beforeEach(() => {
    queueService = {
      sendMessage: vi.fn().mockResolvedValue(undefined),
      sendMessages: vi.fn().mockResolvedValue(undefined),
    };
    dataSource = {
      query: vi.fn(),
    } as unknown as Mocked<DataSource>;
  });

  const createEvent = (messages: Record<string, unknown>[]): SqsBatchEvent => ({
    Records: messages.map((m, i) => ({
      messageId: `msg-${i}`,
      receiptHandle: `handle-${i}`,
      body: JSON.stringify(m),
    })),
  });

  it('should process a valid message and enqueue a step', async () => {
    dataSource.query.mockImplementation(async (query: string) => {
      if (query.includes('FROM workflows')) return [{ id: 'wf1', is_active: true }];
      if (query.includes('FROM contacts')) return [{ id: 'c1' }];
      if (query.includes('FROM workflow_steps')) return [{ id: 'step1', action: 'delay' }];
      if (query.includes('SELECT id FROM contact_workflows')) return []; // No existing
      if (query.includes('INSERT INTO contact_workflows')) return [{ id: 'cw1' }];
      return [];
    });

    const msg = {
      version: 1,
      messageId: '77777777-7777-4777-a777-777777777777',
      tenantId: '11111111-1111-4111-a111-111111111111',
      createdAt: '2024-01-01T00:00:00Z',
      contactId: '22222222-2222-4222-a222-222222222222',
      event: 'contact.subscribed',
      occurredAt: '2024-01-01T00:00:00Z',
      matchedTriggerIds: ['55555555-5555-4555-a555-555555555555'],
      matchedWorkflowIds: ['33333333-3333-4333-a333-333333333333'],
    };

    const result = await handler(createEvent([msg]), {
      queueService,
      cacheService: {} as CacheService,
      dataSource,
    });

    expect(result.batchItemFailures).toHaveLength(0);
    expect(queueService.sendMessage).toHaveBeenCalledTimes(1);
    const queuedMsg = queueService.sendMessage.mock.calls[0][1] as {
      contactWorkflowId: string;
      workflowStepId: string;
    };
    expect(queuedMsg.contactWorkflowId).toBe('cw1');
    expect(queuedMsg.workflowStepId).toBe('step1');
  });

  it('should skip inactive workflows', async () => {
    dataSource.query.mockImplementation(async (query: string) => {
      if (query.includes('FROM workflows')) return [{ id: 'wf1', is_active: false }];
      return [];
    });

    const msg = {
      version: 1,
      messageId: '77777777-7777-4777-a777-777777777777',
      tenantId: '11111111-1111-4111-a111-111111111111',
      createdAt: '2024-01-01T00:00:00Z',
      contactId: '22222222-2222-4222-a222-222222222222',
      event: 'contact.subscribed',
      occurredAt: '2024-01-01T00:00:00Z',
      matchedTriggerIds: ['55555555-5555-4555-a555-555555555555'],
      matchedWorkflowIds: ['33333333-3333-4333-a333-333333333333'],
    };

    const result = await handler(createEvent([msg]), {
      queueService,
      cacheService: {} as CacheService,
      dataSource,
    });

    expect(result.batchItemFailures).toHaveLength(0);
    expect(queueService.sendMessage).not.toHaveBeenCalled();
  });

  it('should skip deleted contacts', async () => {
    dataSource.query.mockImplementation(async (query: string) => {
      if (query.includes('FROM workflows')) return [{ id: 'wf1', is_active: true }];
      if (query.includes('FROM contacts')) return []; // Contact deleted or not found
      return [];
    });

    const msg = {
      version: 1,
      messageId: '77777777-7777-4777-a777-777777777777',
      tenantId: '11111111-1111-4111-a111-111111111111',
      createdAt: '2024-01-01T00:00:00Z',
      contactId: '22222222-2222-4222-a222-222222222222',
      event: 'contact.subscribed',
      occurredAt: '2024-01-01T00:00:00Z',
      matchedTriggerIds: ['55555555-5555-4555-a555-555555555555'],
      matchedWorkflowIds: ['33333333-3333-4333-a333-333333333333'],
    };

    const result = await handler(createEvent([msg]), {
      queueService,
      cacheService: {} as CacheService,
      dataSource,
    });

    expect(result.batchItemFailures).toHaveLength(0);
    expect(queueService.sendMessage).not.toHaveBeenCalled();
  });

  it('should be idempotent and not enqueue step if contact_workflow already exists', async () => {
    dataSource.query.mockImplementation(async (query: string) => {
      if (query.includes('FROM workflows')) return [{ id: 'wf1', is_active: true }];
      if (query.includes('FROM contacts')) return [{ id: 'c1' }];
      if (query.includes('FROM workflow_steps')) return [{ id: 'step1', action: 'delay' }];
      if (query.includes('INSERT INTO contact_workflows')) return []; // CTE dedup returned empty array
      return [];
    });

    const msg = {
      version: 1,
      messageId: '77777777-7777-4777-a777-777777777777',
      tenantId: '11111111-1111-4111-a111-111111111111',
      createdAt: '2024-01-01T00:00:00Z',
      contactId: '22222222-2222-4222-a222-222222222222',
      event: 'contact.subscribed',
      occurredAt: '2024-01-01T00:00:00Z',
      matchedTriggerIds: ['55555555-5555-4555-a555-555555555555'],
      matchedWorkflowIds: ['33333333-3333-4333-a333-333333333333'],
    };

    const result = await handler(createEvent([msg]), {
      queueService,
      cacheService: {} as CacheService,
      dataSource,
    });

    expect(result.batchItemFailures).toHaveLength(0);
    expect(queueService.sendMessage).not.toHaveBeenCalled(); // Deduped, so no message sent
  });

  it('should handle partial batch failure', async () => {
    // We'll throw an error for the second query only
    let callCount = 0;
    dataSource.query.mockImplementation(async (query: string) => {
      callCount++;
      if (callCount > 5) throw new Error('DB Error'); // Fails on the second message

      if (query.includes('FROM workflows')) return [{ id: 'wf1', is_active: true }];
      if (query.includes('FROM contacts')) return [{ id: 'c1' }];
      if (query.includes('FROM workflow_steps')) return [{ id: 'step1', action: 'delay' }];
      if (query.includes('INSERT INTO contact_workflows')) return [{ id: 'cw1' }];
      return [];
    });

    const validMsg = {
      version: 1,
      messageId: '11111111-1111-4111-a111-111111111111',
      tenantId: '11111111-1111-4111-a111-111111111111',
      createdAt: '2024-01-01T00:00:00Z',
      contactId: '22222222-2222-4222-a222-222222222222',
      event: 'contact.subscribed',
      occurredAt: '2024-01-01T00:00:00Z',
      matchedTriggerIds: ['55555555-5555-4555-a555-555555555555'],
      matchedWorkflowIds: ['33333333-3333-4333-a333-333333333333'],
    };

    const failedMsg = {
      ...validMsg,
      messageId: '22222222-2222-4222-a222-222222222222',
    };

    const event = createEvent([validMsg, failedMsg]);

    const result = await handler(event, {
      queueService,
      cacheService: {} as CacheService,
      dataSource,
    });

    expect(result.batchItemFailures).toHaveLength(1);
    expect(result.batchItemFailures[0].itemIdentifier).toBe('msg-1'); // Actually createEvent uses receiptHandle but our manual event uses "msg-1" for messageId and handles index
  });
});

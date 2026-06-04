import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from './watch-workflow-steps.handler';
import type { Mocked } from 'vitest';
import type { DataSource } from 'typeorm';
import type { QueueService } from '../infrastructure/queue/queue.interface';

describe('watch-workflow-steps.handler', () => {
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

  it('should process due steps and enqueue to finished queue', async () => {
    dataSource.query.mockImplementation(async (query: string) => {
      if (query.includes('SELECT')) {
        return [
          {
            contact_workflow_step_id: 'cws1',
            tenant_id: 't1',
            contact_workflow_id: 'cw1',
            workflow_step_id: 'ws1',
            contact_id: 'c1',
            workflow_id: 'wf1',
            action: 'delay',
          },
        ];
      }
      if (query.includes('UPDATE')) return [[], 1]; // pg style: [rows, rowCount]
      return [];
    });

    await handler({}, { queueService, dataSource });

    expect(queueService.sendMessage).toHaveBeenCalledTimes(1);
    const queuedMsg = queueService.sendMessage.mock.calls[0][1] as {
      action: string;
      contactWorkflowId: string;
    };
    expect(queuedMsg.action).toBe('delay');
    expect(queuedMsg.contactWorkflowId).toBe('cw1');
  });

  it('should skip if no due steps', async () => {
    dataSource.query.mockResolvedValue([]);

    await handler({}, { queueService, dataSource });

    expect(queueService.sendMessage).not.toHaveBeenCalled();
  });
});

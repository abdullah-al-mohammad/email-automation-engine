import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AutomationEventService } from './automation-event.service';

describe('AutomationEventService', () => {
  let service: AutomationEventService;
  let triggerCache: any;
  let queueService: any;
  let configService: any;

  beforeEach(() => {
    triggerCache = {
      getMatchingTriggers: vi.fn(),
    };
    queueService = {
      sendMessage: vi.fn(),
    };
    configService = {
      get: vi.fn().mockReturnValue('automation-events'),
    };
    service = new AutomationEventService(triggerCache, queueService, configService);
  });

  it('should return early if no triggers match', async () => {
    triggerCache.getMatchingTriggers.mockResolvedValue([]);
    await service.ingest({
      tenantId: 't1',
      contactId: 'c1',
      event: 'contact.subscribed',
      occurredAt: '2024-01-01T00:00:00Z',
    });
    expect(queueService.sendMessage).not.toHaveBeenCalled();
  });

  it('should enqueue message if triggers match', async () => {
    triggerCache.getMatchingTriggers.mockResolvedValue([
      { id: 'trig1', workflowId: 'wf1' },
      { id: 'trig2', workflowId: 'wf1' },
    ]);
    await service.ingest({
      tenantId: 't1',
      contactId: 'c1',
      event: 'contact.subscribed',
      occurredAt: '2024-01-01T00:00:00Z',
    });
    expect(queueService.sendMessage).toHaveBeenCalledTimes(1);
    const message = queueService.sendMessage.mock.calls[0][1];
    expect(message.matchedTriggerIds).toEqual(['trig1', 'trig2']);
    expect(message.matchedWorkflowIds).toEqual(['wf1']);
  });
});

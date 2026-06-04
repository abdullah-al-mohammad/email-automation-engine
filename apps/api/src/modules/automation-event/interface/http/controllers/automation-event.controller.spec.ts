import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AutomationEventController } from './automation-event.controller';

describe('AutomationEventController', () => {
  let controller: AutomationEventController;
  let service: any;

  beforeEach(() => {
    service = {
      ingest: vi.fn(),
    };
    controller = new AutomationEventController(service);
  });

  it('should call ingest and return accepted', async () => {
    const dto = {
      tenantId: 't1',
      contactId: 'c1',
      event: 'contact.subscribed' as const,
      occurredAt: '2024-01-01T00:00:00Z',
    };
    const result = await controller.ingestEvent(dto);
    expect(service.ingest).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ accepted: true });
  });
});

import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import type { AutomationEventService } from '../../../application/services/automation-event.service';
import { AutomationEventController } from './automation-event.controller';

describe('AutomationEventController', () => {
  let controller: AutomationEventController;
  let service: { ingest: Mock };

  beforeEach(() => {
    service = {
      ingest: vi.fn(),
    };
    controller = new AutomationEventController(service as unknown as AutomationEventService);
  });

  it('should call ingest and return accepted', async () => {
    const dto = {
      tenantId: 'tenant-1',
      contactId: 'contact-1',
      event: 'contact.subscribed' as const,
      occurredAt: '2024-01-01T00:00:00Z',
    };
    const result = await controller.ingestEvent(dto, 'tenant-1');
    expect(service.ingest).toHaveBeenCalledWith('tenant-1', dto);
    expect(result).toEqual({ accepted: true });
  });
});

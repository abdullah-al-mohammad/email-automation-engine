import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TriggerCacheService } from './trigger-cache.service';

describe('TriggerCacheService', () => {
  let service: TriggerCacheService;
  let cacheService: any;
  let triggerRepository: any;

  beforeEach(() => {
    cacheService = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    };
    triggerRepository = {
      findActiveByEvent: vi.fn(),
    };
    service = new TriggerCacheService(cacheService, triggerRepository);
  });

  it('should return from cache if hit', async () => {
    cacheService.get.mockResolvedValue([{ id: '1' }]);
    const result = await service.getMatchingTriggers('t1', 'e1');
    expect(result).toEqual([{ id: '1' }]);
    expect(triggerRepository.findActiveByEvent).not.toHaveBeenCalled();
  });

  it('should fetch from DB and set cache on miss', async () => {
    cacheService.get.mockResolvedValue(null);
    triggerRepository.findActiveByEvent.mockResolvedValue([{ id: '2' }]);

    const result = await service.getMatchingTriggers('t1', 'e1');
    expect(result).toEqual([{ id: '2' }]);
    expect(triggerRepository.findActiveByEvent).toHaveBeenCalledWith('t1', 'e1');
    expect(cacheService.set).toHaveBeenCalledWith(
      'automation:triggers:tenant:t1:event:e1',
      [{ id: '2' }],
      300,
    );
  });

  it('should fall back to DB if cache get fails', async () => {
    cacheService.get.mockRejectedValue(new Error('Redis down'));
    triggerRepository.findActiveByEvent.mockResolvedValue([{ id: '3' }]);

    const result = await service.getMatchingTriggers('t1', 'e1');
    expect(result).toEqual([{ id: '3' }]);
    expect(triggerRepository.findActiveByEvent).toHaveBeenCalledWith('t1', 'e1');
  });
});

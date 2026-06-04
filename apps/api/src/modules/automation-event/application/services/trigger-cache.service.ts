import { Injectable, Inject, Logger } from '@nestjs/common';
import { ICacheService } from '../../../../infrastructure/cache/cache.interface';
import { CACHE_SERVICE } from '../../../../infrastructure/cache/cache.interface';
import { WorkflowTrigger } from '../../../workflow/domain/aggregates/workflow-trigger.aggregate';
import { WorkflowTriggerRepository } from '../../../workflow/domain/repositories/workflow-trigger.repository';
import { WORKFLOW_TRIGGER_REPOSITORY } from '../../../workflow/constants/tokens';

@Injectable()
export class TriggerCacheService {
  private readonly logger = new Logger(TriggerCacheService.name);
  private readonly TTL_SECONDS = 300;

  constructor(
    @Inject(CACHE_SERVICE)
    private readonly cacheService: ICacheService,
    @Inject(WORKFLOW_TRIGGER_REPOSITORY)
    private readonly triggerRepository: WorkflowTriggerRepository,
  ) {}

  private getKey(tenantId: string, event: string): string {
    return `automation:triggers:tenant:${tenantId}:event:${event}`;
  }

  async getMatchingTriggers(tenantId: string, event: string): Promise<WorkflowTrigger[]> {
    const key = this.getKey(tenantId, event);

    try {
      const cached = await this.cacheService.get<WorkflowTrigger[]>(key);
      if (cached) {
        return cached;
      }
    } catch (error) {
      this.logger.warn(`Failed to read from cache for key ${key}: ${String(error)}`);
    }

    // Fallback to database
    const triggers = await this.triggerRepository.findActiveByEvent(tenantId, event);

    try {
      await this.cacheService.set(key, triggers, this.TTL_SECONDS);
    } catch (error) {
      this.logger.warn(`Failed to write to cache for key ${key}: ${String(error)}`);
    }

    return triggers;
  }

  async invalidateCache(tenantId: string, events: string[]): Promise<void> {
    for (const event of events) {
      const key = this.getKey(tenantId, event);
      try {
        await this.cacheService.del(key);
      } catch (error) {
        this.logger.warn(`Failed to invalidate cache for key ${key}: ${String(error)}`);
      }
    }
  }
}

import { Injectable, Inject, Logger } from '@nestjs/common';
import { ICacheService } from '../../../../infrastructure/cache/cache.interface';
import { CACHE_SERVICE } from '../../../../infrastructure/cache/cache.interface';
import { WorkflowTrigger } from '../../../workflow/domain/aggregates/workflow-trigger.aggregate';
import { WorkflowTriggerRepository } from '../../../workflow/domain/repositories/workflow-trigger.repository';
import { WORKFLOW_TRIGGER_REPOSITORY } from '../../../workflow/constants/tokens';

interface CachedTrigger {
  id: string;
  tenantId: string;
  workflowId: string;
  event: string;
  filters?: Record<string, unknown>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

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

  public static getCacheKey(tenantId: string, event: string): string {
    return `automation:triggers:tenant:${tenantId}:event:${event}`;
  }

  private getKey(tenantId: string, event: string): string {
    return TriggerCacheService.getCacheKey(tenantId, event);
  }

  async getMatchingTriggers(tenantId: string, event: string): Promise<WorkflowTrigger[]> {
    const key = this.getKey(tenantId, event);

    try {
      const cached = await this.cacheService.get<CachedTrigger[]>(key);
      if (cached) {
        return cached.map((c) => {
          const t = new WorkflowTrigger();
          t.id = c.id;
          t.tenantId = c.tenantId;
          t.workflowId = c.workflowId;
          t.event = c.event;
          t.filters = c.filters;
          t.createdAt = new Date(c.createdAt);
          t.updatedAt = new Date(c.updatedAt);
          return t;
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to read from cache for key ${key}: ${String(error)}`);
    }

    // Fallback to database
    const triggers = await this.triggerRepository.findActiveByEvent(tenantId, event);

    try {
      const cacheableTriggers = triggers.map((t) => ({
        id: t.id,
        tenantId: t.tenantId,
        workflowId: t.workflowId,
        event: t.event,
        filters: t.filters,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));
      await this.cacheService.set(key, cacheableTriggers, this.TTL_SECONDS);
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

import { Module } from '@nestjs/common';
import { AutomationEventController } from './interface/http/controllers/automation-event.controller';
import { AutomationEventService } from './application/services/automation-event.service';
import { TriggerCacheService } from './application/services/trigger-cache.service';
import { WorkflowModule } from '../workflow/workflow.module';
import { IamModule } from '../iam/iam.module';
import { TRIGGER_CACHE_SERVICE } from './constants/tokens';

@Module({
  imports: [WorkflowModule, IamModule],
  controllers: [AutomationEventController],
  providers: [
    AutomationEventService,
    TriggerCacheService,
    {
      provide: TRIGGER_CACHE_SERVICE,
      useExisting: TriggerCacheService,
    },
  ],
  exports: [AutomationEventService, TRIGGER_CACHE_SERVICE],
})
export class AutomationEventModule {}

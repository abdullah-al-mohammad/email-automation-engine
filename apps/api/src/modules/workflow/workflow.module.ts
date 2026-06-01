import { Module } from '@nestjs/common';
import { WORKFLOW_REPOSITORY } from './constants/tokens';
import { InMemoryWorkflowRepository } from './infrastructure/repositories/in-memory-workflow.repository';
import { HealthController } from './interface/health.controller';

@Module({
  controllers: [HealthController],
  providers: [
    {
      provide: WORKFLOW_REPOSITORY,
      useClass: InMemoryWorkflowRepository,
    },
  ],
  exports: [WORKFLOW_REPOSITORY],
})
export class WorkflowModule {}

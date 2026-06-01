import { Module } from '@nestjs/common';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { WorkflowModule } from './modules/workflow/workflow.module';

@Module({
  imports: [InfrastructureModule, WorkflowModule],
})
export class AppModule {}

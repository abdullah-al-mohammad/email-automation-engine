import { Module } from '@nestjs/common';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { IamModule } from './modules/iam/iam.module';

@Module({
  imports: [InfrastructureModule, IamModule, WorkflowModule],
})
export class AppModule {}

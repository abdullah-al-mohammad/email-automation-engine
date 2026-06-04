import { Module } from '@nestjs/common';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { IamModule } from './modules/iam/iam.module';
import { ContactModule } from './modules/contact/contact.module';
import { ContactWorkflowModule } from './modules/contact-workflow/contact-workflow.module';
import { AutomationEventModule } from './modules/automation-event/automation-event.module';

@Module({
  imports: [
    InfrastructureModule,
    IamModule,
    WorkflowModule,
    ContactModule,
    ContactWorkflowModule,
    AutomationEventModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';

import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { AutomationEventModule } from './modules/automation-event/automation-event.module';
import { ContactModule } from './modules/contact/contact.module';
import { ContactWorkflowModule } from './modules/contact-workflow/contact-workflow.module';
import { EmailModule } from './modules/email/email.module';
import { IamModule } from './modules/iam/iam.module';
import { WorkflowModule } from './modules/workflow/workflow.module';

@Module({
  imports: [
    InfrastructureModule,
    IamModule,
    WorkflowModule,
    ContactModule,
    ContactWorkflowModule,
    AutomationEventModule,
    EmailModule,
  ],
})
export class AppModule {}

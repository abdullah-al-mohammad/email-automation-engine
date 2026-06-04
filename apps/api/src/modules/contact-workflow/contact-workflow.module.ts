import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactWorkflow } from './domain/aggregates/contact-workflow.aggregate';
import { ContactWorkflowStep } from './domain/aggregates/contact-workflow-step.aggregate';
import { TypeOrmContactWorkflowRepository } from './infrastructure/repositories/typeorm-contact-workflow.repository';
import { TypeOrmContactWorkflowStepRepository } from './infrastructure/repositories/typeorm-contact-workflow-step.repository';
import { CONTACT_WORKFLOW_REPOSITORY, CONTACT_WORKFLOW_STEP_REPOSITORY } from './constants/tokens';
import { ContactWorkflowService } from './application/services/contact-workflow.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContactWorkflow, ContactWorkflowStep])],
  providers: [
    {
      provide: CONTACT_WORKFLOW_REPOSITORY,
      useClass: TypeOrmContactWorkflowRepository,
    },
    {
      provide: CONTACT_WORKFLOW_STEP_REPOSITORY,
      useClass: TypeOrmContactWorkflowStepRepository,
    },
    ContactWorkflowService,
  ],
  exports: [CONTACT_WORKFLOW_REPOSITORY, CONTACT_WORKFLOW_STEP_REPOSITORY, ContactWorkflowService],
})
export class ContactWorkflowModule {}

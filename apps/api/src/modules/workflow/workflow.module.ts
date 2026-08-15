import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmailModule } from '../email/email.module';
import { IamModule } from '../iam/iam.module';
import { WorkflowService } from './application/services/workflow.service';
import { WorkflowExitConditionService } from './application/services/workflow-exit-condition.service';
import { WorkflowStepService } from './application/services/workflow-step.service';
import { WorkflowStepConditionService } from './application/services/workflow-step-condition.service';
import { WorkflowTriggerService } from './application/services/workflow-trigger.service';
import {
  WORKFLOW_EXIT_CONDITION_REPOSITORY,
  WORKFLOW_REPOSITORY,
  WORKFLOW_STEP_CONDITION_REPOSITORY,
  WORKFLOW_STEP_REPOSITORY,
  WORKFLOW_TRIGGER_REPOSITORY,
} from './constants/tokens';
import { Workflow } from './domain/aggregates/workflow.aggregate';
import { WorkflowExitCondition } from './domain/aggregates/workflow-exit-condition.aggregate';
import { WorkflowStep } from './domain/aggregates/workflow-step.aggregate';
import { WorkflowStepCondition } from './domain/aggregates/workflow-step-condition.aggregate';
import { WorkflowTrigger } from './domain/aggregates/workflow-trigger.aggregate';
import { TypeOrmWorkflowRepository } from './infrastructure/repositories/typeorm-workflow.repository';
import { TypeOrmWorkflowExitConditionRepository } from './infrastructure/repositories/typeorm-workflow-exit-condition.repository';
import { TypeOrmWorkflowStepRepository } from './infrastructure/repositories/typeorm-workflow-step.repository';
import { TypeOrmWorkflowStepConditionRepository } from './infrastructure/repositories/typeorm-workflow-step-condition.repository';
import { TypeOrmWorkflowTriggerRepository } from './infrastructure/repositories/typeorm-workflow-trigger.repository';
import { HealthController } from './interface/health.controller';
import { WorkflowController } from './interface/workflow.controller';
import { WorkflowStepConditionController } from './interface/workflow-step-condition.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workflow,
      WorkflowTrigger,
      WorkflowStep,
      WorkflowExitCondition,
      WorkflowStepCondition,
    ]),
    IamModule, // Import IamModule for the AuthGuard and token services
    EmailModule,
  ],
  controllers: [HealthController, WorkflowController, WorkflowStepConditionController],
  providers: [
    WorkflowService,
    WorkflowTriggerService,
    WorkflowStepService,
    WorkflowExitConditionService,
    WorkflowStepConditionService,
    {
      provide: WORKFLOW_REPOSITORY,
      useClass: TypeOrmWorkflowRepository,
    },
    {
      provide: WORKFLOW_TRIGGER_REPOSITORY,
      useClass: TypeOrmWorkflowTriggerRepository,
    },
    {
      provide: WORKFLOW_STEP_REPOSITORY,
      useClass: TypeOrmWorkflowStepRepository,
    },
    {
      provide: WORKFLOW_EXIT_CONDITION_REPOSITORY,
      useClass: TypeOrmWorkflowExitConditionRepository,
    },
    {
      provide: WORKFLOW_STEP_CONDITION_REPOSITORY,
      useClass: TypeOrmWorkflowStepConditionRepository,
    },
  ],
  exports: [
    WORKFLOW_REPOSITORY,
    WORKFLOW_TRIGGER_REPOSITORY,
    WORKFLOW_STEP_REPOSITORY,
    WORKFLOW_EXIT_CONDITION_REPOSITORY,
    WORKFLOW_STEP_CONDITION_REPOSITORY,
    WorkflowService,
  ],
})
export class WorkflowModule {}

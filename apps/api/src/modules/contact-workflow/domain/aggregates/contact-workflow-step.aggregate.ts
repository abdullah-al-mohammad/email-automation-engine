import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v7 as uuidv7 } from 'uuid';

import { Tenant } from '../../../iam/domain/aggregates/tenant.aggregate';
import { WorkflowStep } from '../../../workflow/domain/aggregates/workflow-step.aggregate';
import { ContactWorkflow } from './contact-workflow.aggregate';

@Entity('contact_workflow_steps')
export class ContactWorkflowStep {
  @PrimaryColumn('uuid')
  id!: string;
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'uuid' })
  contactWorkflowId!: string;

  @Column({ type: 'uuid' })
  workflowStepId!: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: string;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  finishedAt?: Date;

  @Column({ type: 'text', nullable: true })
  error?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn()
  tenant?: Tenant;

  @ManyToOne(() => ContactWorkflow)
  @JoinColumn()
  contactWorkflow?: ContactWorkflow;

  @ManyToOne(() => WorkflowStep)
  @JoinColumn()
  workflowStep?: WorkflowStep;
}

import { v7 as uuidv7 } from 'uuid';
import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  PrimaryColumn,
} from 'typeorm';
import { Tenant } from '../../../iam/domain/aggregates/tenant.aggregate';
import { ContactWorkflow } from './contact-workflow.aggregate';
import { WorkflowStep } from '../../../workflow/domain/aggregates/workflow-step.aggregate';

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

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'contact_workflow_id', type: 'uuid' })
  contactWorkflowId!: string;

  @Column({ name: 'workflow_step_id', type: 'uuid' })
  workflowStepId!: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: string;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ name: 'scheduled_at', type: 'timestamp', nullable: true })
  scheduledAt?: Date;

  @Column({ name: 'finished_at', type: 'timestamp', nullable: true })
  finishedAt?: Date;

  @Column({ type: 'text', nullable: true })
  error?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant?: Tenant;

  @ManyToOne(() => ContactWorkflow)
  @JoinColumn({ name: 'contact_workflow_id' })
  contactWorkflow?: ContactWorkflow;

  @ManyToOne(() => WorkflowStep)
  @JoinColumn({ name: 'workflow_step_id' })
  workflowStep?: WorkflowStep;
}

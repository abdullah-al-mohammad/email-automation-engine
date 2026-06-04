import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../../iam/domain/aggregates/tenant.aggregate';
import { Workflow } from '../../../workflow/domain/aggregates/workflow.aggregate';
import { WorkflowTrigger } from '../../../workflow/domain/aggregates/workflow-trigger.aggregate';
import { Contact } from '../../../contact/domain/aggregates/contact.aggregate';

@Entity('contact_workflows')
export class ContactWorkflow {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'workflow_id', type: 'uuid' })
  workflowId!: string;

  @Column({ name: 'workflow_trigger_id', type: 'uuid', nullable: true })
  workflowTriggerId?: string;

  @Column({ name: 'contact_id', type: 'uuid' })
  contactId!: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: string;

  @Column({ name: 'trigger_event', type: 'varchar', length: 100 })
  triggerEvent!: string;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ name: 'finished_at', type: 'timestamp', nullable: true })
  finishedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant?: Tenant;

  @ManyToOne(() => Workflow)
  @JoinColumn({ name: 'workflow_id' })
  workflow?: Workflow;

  @ManyToOne(() => WorkflowTrigger)
  @JoinColumn({ name: 'workflow_trigger_id' })
  workflowTrigger?: WorkflowTrigger;

  @ManyToOne(() => Contact)
  @JoinColumn({ name: 'contact_id' })
  contact?: Contact;
}

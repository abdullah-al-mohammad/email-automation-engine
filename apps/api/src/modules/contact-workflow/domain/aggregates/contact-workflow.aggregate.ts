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
import { Workflow } from '../../../workflow/domain/aggregates/workflow.aggregate';
import { WorkflowTrigger } from '../../../workflow/domain/aggregates/workflow-trigger.aggregate';
import { Contact } from '../../../contact/domain/aggregates/contact.aggregate';

@Entity('contact_workflows')
export class ContactWorkflow {
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
  workflowId!: string;

  @Column({ type: 'uuid', nullable: true })
  workflowTriggerId?: string;

  @Column({ type: 'uuid' })
  contactId!: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: string;

  @Column({ type: 'varchar', length: 100 })
  triggerEvent!: string;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  finishedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn()
  tenant?: Tenant;

  @ManyToOne(() => Workflow)
  @JoinColumn()
  workflow?: Workflow;

  @ManyToOne(() => WorkflowTrigger)
  @JoinColumn()
  workflowTrigger?: WorkflowTrigger;

  @ManyToOne(() => Contact)
  @JoinColumn()
  contact?: Contact;
}

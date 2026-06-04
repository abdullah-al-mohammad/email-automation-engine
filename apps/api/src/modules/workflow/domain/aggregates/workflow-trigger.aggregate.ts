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
import { Workflow } from './workflow.aggregate';

@Entity('workflow_triggers')
export class WorkflowTrigger {
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

  @Column({ name: 'workflow_id', type: 'uuid' })
  workflowId!: string;

  @ManyToOne(() => Workflow)
  @JoinColumn({ name: 'workflow_id' })
  workflow?: Workflow;

  @Column({ type: 'varchar', length: 100 })
  event!: string;

  @Column({ type: 'jsonb', nullable: true })
  filters?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

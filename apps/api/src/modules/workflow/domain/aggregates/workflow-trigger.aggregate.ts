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

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'uuid' })
  workflowId!: string;

  @ManyToOne(() => Workflow)
  @JoinColumn()
  workflow?: Workflow;

  @Column({ type: 'varchar', length: 100 })
  event!: string;

  @Column({ type: 'jsonb', nullable: true })
  filters?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

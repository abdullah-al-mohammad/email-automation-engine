import { v7 as uuidv7 } from 'uuid';
import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  PrimaryColumn,
} from 'typeorm';

@Entity('workflow_steps')
export class WorkflowStep {
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

  @Column({ name: 'parent_workflow_step_id', type: 'uuid', nullable: true })
  parentWorkflowStepId?: string;

  @Column({ type: 'varchar', length: 100 })
  action!: string;

  @Column({ type: 'jsonb', nullable: true })
  config?: Record<string, unknown>;

  @Column({ type: 'int', default: 0 })
  position!: number;

  @Column({ name: 'true_step_id', type: 'uuid', nullable: true })
  trueStepId?: string;

  @Column({ name: 'false_step_id', type: 'uuid', nullable: true })
  falseStepId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

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

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'uuid' })
  workflowId!: string;

  @Column({ type: 'uuid', nullable: true })
  parentWorkflowStepId?: string;

  @Column({ type: 'varchar', length: 100 })
  action!: string;

  @Column({ type: 'jsonb', nullable: true })
  config?: Record<string, unknown>;

  @Column({ type: 'int', default: 0 })
  position!: number;

  @Column({ type: 'uuid', nullable: true })
  trueStepId?: string;

  @Column({ type: 'uuid', nullable: true })
  falseStepId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

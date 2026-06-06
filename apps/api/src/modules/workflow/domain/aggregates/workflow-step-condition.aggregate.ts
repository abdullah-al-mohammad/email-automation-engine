import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { v7 as uuidv7 } from 'uuid';

@Entity('workflow_step_conditions')
export class WorkflowStepCondition {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  workflowId!: string;

  @Column('uuid')
  workflowStepId!: string;

  @Column({ length: 50 })
  type!: string;

  @Column({ length: 255 })
  resource!: string;

  @Column({ length: 50 })
  operator!: string;

  @Column('text', { nullable: true })
  value!: string | null;

  @Column({ length: 10, default: 'AND' })
  logicalOperator!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}

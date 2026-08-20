import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v7 as uuidv7 } from 'uuid';

@Entity('workflow_exit_conditions')
export class WorkflowExitCondition {
  @PrimaryColumn('uuid')
  id!: string;
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }

  @Column({ type: 'uuid', nullable: false })
  tenantId!: string;

  @Column({ type: 'uuid', nullable: false })
  workflowId!: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  logicalOperator!: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  type!: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  resource!: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  operator!: string;

  @Column({ type: 'text', nullable: true })
  value?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Workflow } from './workflow.aggregate';

@Entity('workflow_triggers')
export class WorkflowTrigger {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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

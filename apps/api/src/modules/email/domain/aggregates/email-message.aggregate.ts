import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  Index,
} from 'typeorm';
import { v7 as uuidv7 } from 'uuid';

@Entity('email_messages')
@Index('IDX_email_messages_contact_workflow_step', ['contactWorkflowStepId'], { unique: true })
@Index('IDX_email_messages_ses_message_id', ['sesMessageId'], {
  unique: true,
  where: 'ses_message_id IS NOT NULL',
})
export class EmailMessage {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  contactId!: string;

  @Column('uuid')
  contactWorkflowId!: string;

  @Column('uuid')
  contactWorkflowStepId!: string;

  @Column('uuid')
  workflowId!: string;

  @Column('uuid')
  workflowStepId!: string;

  @Column('uuid', { nullable: true })
  templateId!: string | null;

  @Column('varchar', { length: 255, nullable: true })
  sesMessageId!: string | null;

  @Column('varchar', { length: 64, nullable: true })
  recipientEmailHash!: string | null;

  @Column('varchar', { length: 998 })
  subject!: string;

  @Column('varchar', { length: 50, default: 'pending' })
  status!: string;

  @Column('timestamp', { nullable: true })
  sentAt!: Date | null;

  @Column('timestamp', { nullable: true })
  deliveredAt!: Date | null;

  @Column('timestamp', { nullable: true })
  bouncedAt!: Date | null;

  @Column('timestamp', { nullable: true })
  complainedAt!: Date | null;

  @Column('timestamp', { nullable: true })
  firstOpenedAt!: Date | null;

  @Column('timestamp', { nullable: true })
  lastOpenedAt!: Date | null;

  @Column('timestamp', { nullable: true })
  firstClickedAt!: Date | null;

  @Column('timestamp', { nullable: true })
  lastClickedAt!: Date | null;

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

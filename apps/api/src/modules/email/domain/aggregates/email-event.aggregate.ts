import { BeforeInsert, Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';

@Entity('email_events')
@Index('IDX_email_events_dedup', ['emailMessageId', 'event', 'occurredAt'], { unique: true })
export class EmailEvent {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  emailMessageId!: string;

  @Column('uuid')
  contactId!: string;

  @Column('varchar', { length: 50 })
  event!: string;

  @Column('text', { nullable: true })
  url!: string | null;

  @Column('jsonb', { nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column('timestamp')
  occurredAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}

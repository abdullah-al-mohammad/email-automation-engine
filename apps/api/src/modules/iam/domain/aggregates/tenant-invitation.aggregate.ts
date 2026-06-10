import { v7 as uuidv7 } from 'uuid';
import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  PrimaryColumn,
} from 'typeorm';

@Entity('tenant_invitations')
@Index(['tenantId', 'email'], { unique: true })
export class TenantInvitation {
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
  senderId!: string;

  @Column({ type: 'uuid' })
  roleId!: string;

  @Column()
  email!: string;

  @Column({ unique: true })
  invitationToken!: string;

  @Column({ type: 'text', nullable: true })
  message!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

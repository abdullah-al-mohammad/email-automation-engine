import { v7 as uuidv7 } from 'uuid';
import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  BeforeInsert,
  PrimaryColumn,
} from 'typeorm';
import { Tenant } from '../../../iam/domain/aggregates/tenant.aggregate';
import { Tag } from './tag.aggregate';

@Entity('contacts')
export class Contact {
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

  @Column({ type: 'varchar', length: 254 })
  email!: string;

  @Column({ type: 'boolean', default: true })
  subscribed!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn()
  tenant?: Tenant;

  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'contact_tags',
    joinColumn: { name: 'contact_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags?: Tag[];
}

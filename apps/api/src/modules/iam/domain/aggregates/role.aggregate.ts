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

@Entity('roles')
@Index(['tenantId', 'slug'], { unique: true })
export class Role {
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

  @Column({ type: 'varchar', length: 50 })
  name!: string;

  @Column({ type: 'varchar', length: 50 })
  slug!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

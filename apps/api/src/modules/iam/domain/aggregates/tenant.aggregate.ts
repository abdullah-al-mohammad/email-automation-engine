import { v7 as uuidv7 } from 'uuid';
import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  PrimaryColumn,
} from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryColumn('uuid')
  id!: string;
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'uuid' })
  creatorId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

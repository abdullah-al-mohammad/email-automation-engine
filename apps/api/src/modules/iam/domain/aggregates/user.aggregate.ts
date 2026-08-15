import { USER_STATUS, type UserStatus } from '@email-automation-engine/shared';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v7 as uuidv7 } from 'uuid';

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  id!: string;
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }

  @Column({ type: 'varchar', length: 254, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 60 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 20, default: USER_STATUS.NEW })
  status!: UserStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

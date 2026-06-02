import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { type UserStatus, USER_NEW } from '@email-automation-engine/shared';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 254, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 60 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 20, default: USER_NEW })
  status!: UserStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

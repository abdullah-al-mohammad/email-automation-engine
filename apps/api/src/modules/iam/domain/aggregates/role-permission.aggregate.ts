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

@Entity('role_permissions')
@Index(['roleId', 'permission'], { unique: true })
export class RolePermission {
  @PrimaryColumn('uuid')
  id!: string;
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }

  @Column({ type: 'uuid' })
  roleId!: string;

  @Column({ type: 'varchar', length: 100 })
  permission!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

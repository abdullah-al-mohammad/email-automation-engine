import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../domain/aggregates/role.aggregate';
import { RolePermission } from '../../domain/aggregates/role-permission.aggregate';
import { type RoleRepository } from '../../domain/repositories/role.repository';

@Injectable()
export class TypeOrmRoleRepository implements RoleRepository {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly permissionRepo: Repository<RolePermission>,
  ) {}

  async findById(id: string): Promise<Role | null> {
    return this.roleRepo.findOne({ where: { id } });
  }

  async findAllByTenantId(tenantId: string): Promise<Role[]> {
    return this.roleRepo.find({ where: { tenantId }, order: { createdAt: 'ASC' } });
  }

  async save(role: Role): Promise<Role> {
    return this.roleRepo.save(role);
  }

  async delete(id: string): Promise<void> {
    await this.roleRepo.delete(id);
  }

  async savePermission(permission: RolePermission): Promise<RolePermission> {
    return this.permissionRepo.save(permission);
  }

  async findPermissionsByRole(roleId: string): Promise<RolePermission[]> {
    return this.permissionRepo.find({ where: { roleId } });
  }
}

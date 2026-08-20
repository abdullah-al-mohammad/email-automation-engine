import {
  type CreateRoleDto,
  type RoleResponse,
  type UpdateRoleDto,
} from '@email-automation-engine/shared';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ROLE_REPOSITORY } from '../../constants/tokens';
import { Role } from '../../domain/aggregates/role.aggregate';
import { RolePermission } from '../../domain/aggregates/role-permission.aggregate';
import { RoleRepository } from '../../domain/repositories/role.repository';

@Injectable()
export class RoleService {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepo: RoleRepository,
    private readonly dataSource: DataSource,
  ) {}

  async findAllByTenantId(tenantId: string): Promise<RoleResponse[]> {
    const roles = await this.roleRepo.findAllByTenantId(tenantId);
    return Promise.all(roles.map((r) => this.mapToResponse(r)));
  }

  async findById(tenantId: string, id: string): Promise<RoleResponse> {
    const role = await this.roleRepo.findById(id);
    if (!role || role.tenantId !== tenantId) throw new NotFoundException('Role not found');
    return this.mapToResponse(role);
  }

  async create(tenantId: string, dto: CreateRoleDto): Promise<RoleResponse> {
    const role = new Role();
    role.tenantId = tenantId;
    role.name = dto.name;
    role.slug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    role.description = dto.description ?? null;

    return this.dataSource.transaction(async (manager) => {
      const savedRole = await manager.save(role);
      for (const p of dto.permissions) {
        const rp = new RolePermission();
        rp.roleId = savedRole.id;
        rp.permission = p;
        await manager.save(rp);
      }
      return this.mapToResponse(savedRole, dto.permissions);
    });
  }

  async update(tenantId: string, id: string, dto: UpdateRoleDto): Promise<RoleResponse> {
    const role = await this.roleRepo.findById(id);
    if (!role || role.tenantId !== tenantId) throw new NotFoundException('Role not found');

    if (dto.name) {
      role.name = dto.name;
    }
    if (dto.description !== undefined) {
      role.description = dto.description;
    }

    return this.dataSource.transaction(async (manager) => {
      const savedRole = await manager.save(role);

      if (dto.permissions) {
        await manager.delete(RolePermission, { roleId: role.id });
        for (const p of dto.permissions) {
          const rp = new RolePermission();
          rp.roleId = role.id;
          rp.permission = p;
          await manager.save(rp);
        }
        return this.mapToResponse(savedRole, dto.permissions);
      }
      return this.mapToResponse(savedRole);
    });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const role = await this.roleRepo.findById(id);
    if (!role || role.tenantId !== tenantId) throw new NotFoundException('Role not found');
    await this.roleRepo.delete(id);
  }

  private async mapToResponse(role: Role, permissions?: string[]): Promise<RoleResponse> {
    const perms =
      permissions ?? (await this.roleRepo.findPermissionsByRole(role.id)).map((p) => p.permission);
    return {
      id: role.id,
      tenantId: role.tenantId,
      name: role.name,
      slug: role.slug,
      description: role.description,
      permissions: perms,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    };
  }
}

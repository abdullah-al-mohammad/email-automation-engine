import { type Role } from '../aggregates/role.aggregate';
import { type RolePermission } from '../aggregates/role-permission.aggregate';

export interface RoleRepository {
  findById(id: string): Promise<Role | null>;
  findAllByTenantId(tenantId: string): Promise<Role[]>;
  save(role: Role): Promise<Role>;
  delete(id: string): Promise<void>;
  savePermission(permission: RolePermission): Promise<RolePermission>;
  findPermissionsByRole(roleId: string): Promise<RolePermission[]>;
}

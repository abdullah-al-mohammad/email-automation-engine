import { type Role } from '../aggregates/role.aggregate';
import { type RolePermission } from '../aggregates/role-permission.aggregate';

export interface RoleRepository {
  save(role: Role): Promise<Role>;
  savePermission(permission: RolePermission): Promise<RolePermission>;
  findPermissionsByRole(roleId: string): Promise<RolePermission[]>;
}

import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  Inject,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Permission } from '@email-automation-engine/shared';
import { ROLE_REPOSITORY } from '../../constants/tokens';
import { type RoleRepository } from '../../domain/repositories/role.repository';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { type AuthenticatedRequest } from '../types/authenticated-request';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepo: RoleRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    const tenant = request.tenant;
    const membership = request.tenantMembership;

    if (!user || !tenant) {
      throw new ForbiddenException('User and tenant context are required for permission check');
    }

    // Tenant creator always has full access (recovery/ownership fallback)
    if (tenant.creatorId === user.id) {
      return true;
    }

    if (!membership) {
      throw new ForbiddenException('No active membership found for the tenant');
    }

    const rolePermissions = await this.roleRepo.findPermissionsByRole(membership.roleId);
    const userPermissions = rolePermissions.map((p) => p.permission);

    const hasAllPermissions = requiredPermissions.every((perm) => userPermissions.includes(perm));
    if (!hasAllPermissions) {
      throw new ForbiddenException(
        'You do not have the required permissions to perform this action',
      );
    }

    return true;
  }
}

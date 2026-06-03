import { describe, expect, it, beforeEach, vi, type Mock } from 'vitest';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let roleRepo: { findPermissionsByRole: Mock };

  beforeEach(() => {
    reflector = new Reflector();
    roleRepo = {
      findPermissionsByRole: vi.fn(),
    };
    guard = new PermissionsGuard(reflector, roleRepo as unknown as (typeof guard)['roleRepo']);
  });

  const createMockContext = (options: {
    user?: unknown;
    tenant?: unknown;
    membership?: unknown;
  }): ExecutionContext => {
    const request = {
      user: options.user,
      tenant: options.tenant,
      tenantMembership: options.membership,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  it('should return true if route requires no permissions', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({});

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw ForbiddenException if user or tenant context is missing', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['tenant.read']);
    const context = createMockContext({ user: undefined, tenant: undefined });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException('User and tenant context are required for permission check'),
    );
  });

  it('should allow access if user is tenant creator', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['tenant.read']);
    const context = createMockContext({
      user: { id: 'user-1' },
      tenant: { id: 'tenant-1', creatorId: 'user-1' },
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw ForbiddenException if user has no membership and is not creator', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['tenant.read']);
    const context = createMockContext({
      user: { id: 'user-1' },
      tenant: { id: 'tenant-1', creatorId: 'user-2' },
      membership: undefined,
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException('No active membership found for the tenant'),
    );
  });

  it('should allow access if membership role permissions satisfy required permissions', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['tenant.read', 'workflows.read']);
    const context = createMockContext({
      user: { id: 'user-1' },
      tenant: { id: 'tenant-1', creatorId: 'user-2' },
      membership: { roleId: 'role-1' },
    });

    roleRepo.findPermissionsByRole.mockResolvedValue([
      { permission: 'tenant.read' },
      { permission: 'workflows.read' },
      { permission: 'contacts.read' },
    ]);

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw ForbiddenException if membership role permissions lack required permissions', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['tenant.read', 'workflows.read']);
    const context = createMockContext({
      user: { id: 'user-1' },
      tenant: { id: 'tenant-1', creatorId: 'user-2' },
      membership: { roleId: 'role-1' },
    });

    roleRepo.findPermissionsByRole.mockResolvedValue([
      { permission: 'tenant.read' },
      // lacks workflows.read
    ]);

    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException('You do not have the required permissions to perform this action'),
    );
  });
});

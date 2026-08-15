import {
  BadRequestException,
  type ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { TenantMembershipGuard } from './tenant-membership.guard';

describe('TenantMembershipGuard', () => {
  let guard: TenantMembershipGuard;
  let tenantRepo: { findById: Mock };
  let membershipRepo: { findByUserAndTenant: Mock };

  beforeEach(() => {
    tenantRepo = {
      findById: vi.fn(),
    };
    membershipRepo = {
      findByUserAndTenant: vi.fn(),
    };
    guard = new TenantMembershipGuard(
      tenantRepo as unknown as (typeof guard)['tenantRepo'],
      membershipRepo as unknown as (typeof guard)['membershipRepo'],
    );
  });

  const createMockContext = (options: {
    user?: unknown;
    headers?: Record<string, string>;
    params?: Record<string, string>;
    query?: Record<string, string>;
    body?: unknown;
  }): ExecutionContext => {
    const request = {
      user: options.user,
      headers: options.headers ?? {},
      params: options.params ?? {},
      query: options.query ?? {},
      body: options.body,
      tenant: undefined,
      tenantMembership: undefined,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('rejects the request when the user is not authenticated', async () => {
    const context = createMockContext({ user: undefined });
    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException('User is not authenticated'),
    );
  });

  it('rejects the request when the tenant ID is missing', async () => {
    const context = createMockContext({ user: { id: 'user-1' } });
    await expect(guard.canActivate(context)).rejects.toThrow(
      new BadRequestException('Tenant ID is required in X-Tenant-Id header'),
    );
  });

  it('rejects the request when the tenant does not exist', async () => {
    const context = createMockContext({
      user: { id: 'user-1' },
      headers: { 'x-tenant-id': 'tenant-1' },
    });
    tenantRepo.findById.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      new NotFoundException('Tenant not found'),
    );
  });

  it('allows the request when the user has an active membership', async () => {
    const context = createMockContext({
      user: { id: 'user-1' },
      headers: { 'x-tenant-id': 'tenant-1' },
    });
    const mockTenant = { id: 'tenant-1', creatorId: 'user-2' };
    const mockMembership = { tenantId: 'tenant-1', userId: 'user-1' };

    tenantRepo.findById.mockResolvedValue(mockTenant);
    membershipRepo.findByUserAndTenant.mockResolvedValue(mockMembership);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const request = context.switchToHttp().getRequest();
    expect(request.tenant).toBe(mockTenant);
    expect(request.tenantMembership).toBe(mockMembership);
  });

  it('allows the tenant creator even without a membership', async () => {
    const context = createMockContext({
      user: { id: 'user-1' },
      headers: { 'x-tenant-id': 'tenant-1' },
    });
    const mockTenant = { id: 'tenant-1', creatorId: 'user-1' };

    tenantRepo.findById.mockResolvedValue(mockTenant);
    membershipRepo.findByUserAndTenant.mockResolvedValue(null);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const request = context.switchToHttp().getRequest();
    expect(request.tenant).toBe(mockTenant);
  });

  it('rejects a user who is neither a member nor the creator', async () => {
    const context = createMockContext({
      user: { id: 'user-1' },
      headers: { 'x-tenant-id': 'tenant-1' },
    });
    const mockTenant = { id: 'tenant-1', creatorId: 'user-2' };

    tenantRepo.findById.mockResolvedValue(mockTenant);
    membershipRepo.findByUserAndTenant.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException('You do not have access to this tenant'),
    );
  });
});

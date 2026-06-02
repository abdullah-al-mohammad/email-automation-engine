import { describe, expect, it, beforeEach, vi, type Mock } from 'vitest';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  type ExecutionContext,
} from '@nestjs/common';
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
      tenantRepo as unknown as typeof guard['tenantRepo'],
      membershipRepo as unknown as typeof guard['membershipRepo']
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

  it('should throw ForbiddenException if user is not authenticated', async () => {
    const context = createMockContext({ user: undefined });
    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException('User is not authenticated'),
    );
  });

  it('should throw BadRequestException if tenantId is missing', async () => {
    const context = createMockContext({ user: { id: 'user-1' } });
    await expect(guard.canActivate(context)).rejects.toThrow(
      new BadRequestException(
        'Tenant ID is required in X-Tenant-Id header, route params, query, or body',
      ),
    );
  });

  it('should throw NotFoundException if tenant does not exist', async () => {
    const context = createMockContext({
      user: { id: 'user-1' },
      headers: { 'x-tenant-id': 'tenant-1' },
    });
    tenantRepo.findById.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      new NotFoundException('Tenant not found'),
    );
  });

  it('should allow access if user has active membership', async () => {
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

  it('should allow access if user is tenant creator even without membership record', async () => {
    const context = createMockContext({
      user: { id: 'user-1' },
      params: { tenantId: 'tenant-1' },
    });
    const mockTenant = { id: 'tenant-1', creatorId: 'user-1' };

    tenantRepo.findById.mockResolvedValue(mockTenant);
    membershipRepo.findByUserAndTenant.mockResolvedValue(null);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const request = context.switchToHttp().getRequest();
    expect(request.tenant).toBe(mockTenant);
  });

  it('should throw ForbiddenException if user is not a member and not the creator', async () => {
    const context = createMockContext({
      user: { id: 'user-1' },
      query: { tenantId: 'tenant-1' },
    });
    const mockTenant = { id: 'tenant-1', creatorId: 'user-2' };

    tenantRepo.findById.mockResolvedValue(mockTenant);
    membershipRepo.findByUserAndTenant.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException('You do not have access to this tenant'),
    );
  });
});

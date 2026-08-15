import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import type { Role } from '../../domain/aggregates/role.aggregate';
import type { RolePermission } from '../../domain/aggregates/role-permission.aggregate';
import type { Tenant } from '../../domain/aggregates/tenant.aggregate';
import type { TenantMembership } from '../../domain/aggregates/tenant-membership.aggregate';
import { TenantService } from './tenant.service';

describe('TenantService', () => {
  let service: TenantService;
  let tenantRepo: { findById: Mock; findByIds: Mock; findByCreatorId: Mock; save: Mock };
  let roleRepo: {
    findRolesByTenant: Mock;
    findPermissionsByRole: Mock;
    save: Mock;
    savePermission: Mock;
  };
  let membershipRepo: { findByUserAndTenant: Mock; findMembershipsByUser: Mock; save: Mock };

  beforeEach(() => {
    tenantRepo = {
      findById: vi.fn(),
      findByIds: vi.fn(),
      findByCreatorId: vi.fn(),
      save: vi.fn(),
    };
    roleRepo = {
      findRolesByTenant: vi.fn(),
      findPermissionsByRole: vi.fn(),
      save: vi.fn(),
      savePermission: vi.fn(),
    };
    membershipRepo = {
      findByUserAndTenant: vi.fn(),
      findMembershipsByUser: vi.fn(),
      save: vi.fn(),
    };

    service = new TenantService(
      tenantRepo as unknown as (typeof service)['tenantRepo'],
      roleRepo as unknown as (typeof service)['roleRepo'],
      membershipRepo as unknown as (typeof service)['membershipRepo'],
    );
  });

  describe('create', () => {
    it('sets up the tenant, a role, and a membership for the creator', async () => {
      const userId = crypto.randomUUID();

      tenantRepo.save.mockImplementation((t: Tenant) => {
        t.id = 'tenant-1';
        t.createdAt = new Date();
        t.updatedAt = new Date();
        return Promise.resolve(t);
      });
      roleRepo.save.mockImplementation((r: Role) => {
        r.id = 'role-1';
        return Promise.resolve(r);
      });
      roleRepo.savePermission.mockImplementation((p: RolePermission) => Promise.resolve(p));
      membershipRepo.save.mockImplementation((m: TenantMembership) => Promise.resolve(m));

      roleRepo.findRolesByTenant.mockResolvedValue([{ id: 'role-1', slug: 'full-access' }]);
      roleRepo.findPermissionsByRole.mockResolvedValue(new Array(6));
      membershipRepo.findByUserAndTenant.mockResolvedValue({ roleId: 'role-1' });

      const result = await service.create(userId, { name: 'My Test Tenant' });

      expect(result.id).toBeDefined();
      expect(result.name).toBe('My Test Tenant');
      expect(result.creatorId).toBe(userId);

      // Verify role was created
      const roles = await roleRepo.findRolesByTenant(result.id);
      expect(roles).toHaveLength(1);
      expect(roles[0].slug).toBe('full-access');

      // Verify permissions were mapped
      const perms = await roleRepo.findPermissionsByRole(roles[0].id);
      expect(perms.length).toBeGreaterThan(5);

      // Verify membership was created
      const membership = await membershipRepo.findByUserAndTenant(userId, result.id);
      expect(membership).toBeDefined();
      expect(membership?.roleId).toBe(roles[0].id);
    });
  });

  describe('findById', () => {
    it('returns the tenant when the user is the creator or an active member', async () => {
      const creatorId = crypto.randomUUID();
      const mockTenant = {
        id: 'tenant-1',
        name: 'Creator Tenant',
        creatorId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockMembership = { tenantId: 'tenant-1', userId: 'member-1', roleId: 'role-1' };

      tenantRepo.findById.mockResolvedValue(mockTenant);
      membershipRepo.findByUserAndTenant.mockImplementation((userId: string, tenantId: string) => {
        if (userId === 'member-1' && tenantId === 'tenant-1') {
          return Promise.resolve(mockMembership);
        }
        return Promise.resolve(null);
      });

      // Creator can find it
      const foundByCreator = await service.findById('tenant-1', creatorId);
      expect(foundByCreator.name).toBe('Creator Tenant');

      // Member can find it
      const foundByMember = await service.findById('tenant-1', 'member-1');
      expect(foundByMember.name).toBe('Creator Tenant');

      // Random user cannot find it
      const randomUserId = crypto.randomUUID();
      await expect(service.findById('tenant-1', randomUserId)).rejects.toThrow(ForbiddenException);
    });

    it('errors when the tenant does not exist', async () => {
      tenantRepo.findById.mockResolvedValue(null);
      await expect(service.findById('random-id', crypto.randomUUID())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByUser', () => {
    it('returns all tenants the user belongs to', async () => {
      const userId = crypto.randomUUID();
      const mockMembership1 = { tenantId: 'tenant-1', userId };
      const mockMembership2 = { tenantId: 'tenant-2', userId };

      membershipRepo.findMembershipsByUser.mockResolvedValue([mockMembership1, mockMembership2]);

      const mockTenant1 = {
        id: 'tenant-1',
        name: 'Tenant 1',
        creatorId: 'user-2',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockTenant2 = {
        id: 'tenant-2',
        name: 'Tenant 2',
        creatorId: 'user-2',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      tenantRepo.findByIds.mockResolvedValue([mockTenant1, mockTenant2]);
      tenantRepo.findByCreatorId.mockResolvedValue([]);

      const list = await service.findByUser(userId);
      expect(list).toHaveLength(2);
      expect(list.map((x) => x.name)).toContain('Tenant 1');
      expect(list.map((x) => x.name)).toContain('Tenant 2');
    });
  });
});

import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { TenantController } from './tenant.controller';

describe('TenantController', () => {
  let controller: TenantController;
  let tenantService: { create: Mock; findByUser: Mock; findById: Mock };

  beforeEach(() => {
    tenantService = {
      create: vi.fn(),
      findByUser: vi.fn(),
      findById: vi.fn(),
    };
    controller = new TenantController(
      tenantService as unknown as (typeof controller)['tenantService'],
    );
  });

  it('is instantiable', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('forwards create to the tenant service', async () => {
      const user = { id: 'user-uuid' };
      const dto = { name: 'New Tenant' };
      const response = {
        id: 'tenant-uuid',
        name: 'New Tenant',
        creatorId: 'user-uuid',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      tenantService.create.mockResolvedValue(response);

      const result = await controller.create(user, dto);

      expect(tenantService.create).toHaveBeenCalledWith(user.id, dto);
      expect(result).toEqual(response);
    });
  });

  describe('findByUser', () => {
    it('forwards findByUser to the tenant service', async () => {
      const user = { id: 'user-uuid' };
      const response = [
        {
          id: 'tenant-uuid',
          name: 'New Tenant',
          creatorId: 'user-uuid',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      tenantService.findByUser.mockResolvedValue(response);

      const result = await controller.findByUser(user);

      expect(tenantService.findByUser).toHaveBeenCalledWith(user.id);
      expect(result).toEqual(response);
    });
  });

  describe('findById', () => {
    it('forwards findById to the tenant service', async () => {
      const user = { id: 'user-uuid' };
      const tenantId = 'tenant-uuid';
      const response = {
        id: 'tenant-uuid',
        name: 'New Tenant',
        creatorId: 'user-uuid',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      tenantService.findById.mockResolvedValue(response);

      const result = await controller.findById(tenantId, user);

      expect(tenantService.findById).toHaveBeenCalledWith(tenantId, user.id);
      expect(result).toEqual(response);
    });
  });
});

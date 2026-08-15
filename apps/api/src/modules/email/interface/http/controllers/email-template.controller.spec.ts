import 'reflect-metadata';

import type { Mocked } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { EmailTemplateService } from '../../../application/services/email-template.service';
import { EmailTemplate } from '../../../domain/aggregates/email-template.aggregate';
import { EmailTemplateController } from './email-template.controller';

describe('EmailTemplateController', () => {
  let controller: EmailTemplateController;
  let service: Mocked<EmailTemplateService>;

  beforeEach(() => {
    service = {
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
    } as unknown as Mocked<EmailTemplateService>;
    controller = new EmailTemplateController(service);
  });

  const mockTemplate = () => {
    const template = new EmailTemplate();
    template.id = 'tpl-1';
    template.tenantId = 'tenant-1';
    template.name = 'Test Tpl';
    template.subject = 'Subj';
    template.html = '<p>Hi</p>';
    template.text = 'Hi';
    template.createdAt = new Date('2023-01-01');
    template.updatedAt = new Date('2023-01-01');
    template.deletedAt = null;
    return template;
  };

  describe('create', () => {
    it('should create and map template', async () => {
      const tpl = mockTemplate();
      service.create.mockResolvedValue(tpl);

      const dto = { name: 'Test Tpl', subject: 'Subj', html: '<p>Hi</p>' };
      const res = await controller.create('tenant-1', dto);

      expect(service.create).toHaveBeenCalledWith('tenant-1', dto);
      expect(res.id).toBe('tpl-1');
      expect(res.name).toBe('Test Tpl');
    });
  });

  describe('findAll', () => {
    it('should find all and map', async () => {
      service.findAll.mockResolvedValue([mockTemplate()]);

      const res = await controller.findAll('tenant-1');
      expect(service.findAll).toHaveBeenCalledWith('tenant-1');
      expect(res).toHaveLength(1);
      expect(res[0].id).toBe('tpl-1');
    });
  });

  describe('findOne', () => {
    it('should find one and map', async () => {
      service.findOne.mockResolvedValue(mockTemplate());

      const res = await controller.findOne('tenant-1', 'tpl-1');
      expect(service.findOne).toHaveBeenCalledWith('tenant-1', 'tpl-1');
      expect(res.id).toBe('tpl-1');
    });
  });

  describe('update', () => {
    it('should update and map', async () => {
      service.update.mockResolvedValue(mockTemplate());

      const res = await controller.update('tenant-1', 'tpl-1', { name: 'New' });
      expect(service.update).toHaveBeenCalledWith('tenant-1', 'tpl-1', { name: 'New' });
      expect(res.id).toBe('tpl-1');
    });
  });

  describe('remove', () => {
    it('should call soft delete', async () => {
      service.softDelete.mockResolvedValue();
      await controller.remove('tenant-1', 'tpl-1');
      expect(service.softDelete).toHaveBeenCalledWith('tenant-1', 'tpl-1');
    });
  });
});

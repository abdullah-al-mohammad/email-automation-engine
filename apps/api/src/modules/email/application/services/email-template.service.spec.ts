import 'reflect-metadata';

import { NotFoundException } from '@nestjs/common';
import type { Mocked } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EmailTemplate } from '../../domain/aggregates/email-template.aggregate';
import type { IEmailTemplateRepository } from '../../domain/repositories/email-template.repository';
import { EmailTemplateService } from './email-template.service';

describe('EmailTemplateService', () => {
  let service: EmailTemplateService;
  let mockRepository: Mocked<IEmailTemplateRepository>;

  beforeEach(() => {
    mockRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
    } as unknown as Mocked<IEmailTemplateRepository>;
    service = new EmailTemplateService(mockRepository);
  });

  describe('create', () => {
    it('should create and return a template', async () => {
      const dto = { name: 'Test', subject: 'Subj', html: '<p>Hi</p>' };
      const expectedTemplate = new EmailTemplate();
      Object.assign(expectedTemplate, { id: 'uuid', tenantId: 'tenant1', ...dto });

      mockRepository.create.mockResolvedValue(expectedTemplate);

      const result = await service.create('tenant1', dto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant1', name: 'Test', text: null }),
      );
      expect(result).toEqual(expectedTemplate);
    });
  });

  describe('findAll', () => {
    it('should return all templates for a tenant', async () => {
      const templates = [new EmailTemplate()];
      mockRepository.findAll.mockResolvedValue(templates);

      const result = await service.findAll('tenant1');

      expect(mockRepository.findAll).toHaveBeenCalledWith('tenant1');
      expect(result).toEqual(templates);
    });
  });

  describe('findOne', () => {
    it('should return template if found', async () => {
      const template = new EmailTemplate();
      mockRepository.findById.mockResolvedValue(template);

      const result = await service.findOne('tenant1', 'id1');

      expect(mockRepository.findById).toHaveBeenCalledWith('tenant1', 'id1');
      expect(result).toEqual(template);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('tenant1', 'id1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return template', async () => {
      const template = new EmailTemplate();
      template.name = 'Old';
      mockRepository.findById.mockResolvedValue(template);
      mockRepository.update.mockResolvedValue(template);

      const result = await service.update('tenant1', 'id1', { name: 'New' });

      expect(template.name).toBe('New');
      expect(mockRepository.update).toHaveBeenCalledWith(template);
      expect(result).toEqual(template);
    });
  });

  describe('softDelete', () => {
    it('should soft delete template', async () => {
      const template = new EmailTemplate();
      mockRepository.findById.mockResolvedValue(template);
      mockRepository.softDelete.mockResolvedValue();

      await service.softDelete('tenant1', 'id1');

      expect(mockRepository.softDelete).toHaveBeenCalledWith(template);
    });
  });
});

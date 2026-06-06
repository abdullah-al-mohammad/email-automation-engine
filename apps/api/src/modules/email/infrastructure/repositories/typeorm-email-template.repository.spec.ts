import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Mocked } from 'vitest';
import { TypeOrmEmailTemplateRepository } from './typeorm-email-template.repository';
import type { Repository } from 'typeorm';
import { EmailTemplate } from '../../domain/aggregates/email-template.aggregate';

describe('TypeOrmEmailTemplateRepository', () => {
  let repository: TypeOrmEmailTemplateRepository;
  let typeOrmRepo: Mocked<Repository<EmailTemplate>>;

  beforeEach(() => {
    typeOrmRepo = {
      save: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn(),
      softRemove: vi.fn(),
    } as unknown as Mocked<Repository<EmailTemplate>>;
    repository = new TypeOrmEmailTemplateRepository(typeOrmRepo);
  });

  describe('create', () => {
    it('should save and return template', async () => {
      const template = new EmailTemplate();
      typeOrmRepo.save.mockResolvedValue(template);

      const result = await repository.create(template);
      expect(typeOrmRepo.save).toHaveBeenCalledWith(template);
      expect(result).toEqual(template);
    });
  });

  describe('findById', () => {
    it('should find one by id and tenantId', async () => {
      const template = new EmailTemplate();
      typeOrmRepo.findOne.mockResolvedValue(template);

      const result = await repository.findById('tenant-1', 'tpl-1');
      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'tpl-1', tenantId: 'tenant-1' },
      });
      expect(result).toEqual(template);
    });
  });

  describe('findAll', () => {
    it('should find all by tenantId', async () => {
      const templates = [new EmailTemplate()];
      typeOrmRepo.find.mockResolvedValue(templates);

      const result = await repository.findAll('tenant-1');
      expect(typeOrmRepo.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
      });
      expect(result).toEqual(templates);
    });
  });

  describe('update', () => {
    it('should save and return template', async () => {
      const template = new EmailTemplate();
      typeOrmRepo.save.mockResolvedValue(template);

      const result = await repository.update(template);
      expect(typeOrmRepo.save).toHaveBeenCalledWith(template);
      expect(result).toEqual(template);
    });
  });

  describe('softDelete', () => {
    it('should softRemove template', async () => {
      const template = new EmailTemplate();
      typeOrmRepo.softRemove.mockResolvedValue(template);

      await repository.softDelete(template);
      expect(typeOrmRepo.softRemove).toHaveBeenCalledWith(template);
    });
  });
});

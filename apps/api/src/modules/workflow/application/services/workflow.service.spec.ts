import { describe, expect, it, beforeEach, vi, type Mock } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import type { Workflow } from '../../domain/aggregates/workflow.aggregate';
import type { WorkflowStep } from '../../domain/aggregates/workflow-step.aggregate';
import type { WorkflowExitCondition } from '../../domain/aggregates/workflow-exit-condition.aggregate';

describe('WorkflowService', () => {
  let service: WorkflowService;
  let workflowRepo: { findById: Mock; findByTenantId: Mock; save: Mock; delete: Mock };
  let triggerRepo: { findByWorkflowId: Mock; save: Mock; delete: Mock };
  let stepRepo: { findByWorkflowId: Mock; save: Mock; delete: Mock };
  let exitConditionRepo: {
    findByWorkflowId: Mock;
    save: Mock;
    delete: Mock;
    deleteByWorkflowId: Mock;
  };
  let dataSource: { query: Mock; transaction: Mock };

  beforeEach(() => {
    workflowRepo = {
      findById: vi.fn(),
      findByTenantId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    triggerRepo = {
      findByWorkflowId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    stepRepo = {
      findByWorkflowId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    exitConditionRepo = {
      findByWorkflowId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      deleteByWorkflowId: vi.fn(),
    };
    dataSource = {
      query: vi.fn().mockResolvedValue([{ count: '0' }]),
      transaction: vi.fn().mockImplementation(async (cb) => {
        return cb({ save: vi.fn() });
      }),
    };

    service = new WorkflowService(
      workflowRepo as unknown as (typeof service)['workflowRepo'],
      triggerRepo as unknown as (typeof service)['triggerRepo'],
      stepRepo as unknown as (typeof service)['stepRepo'],
      exitConditionRepo as unknown as (typeof service)['exitConditionRepo'],
      dataSource as unknown as (typeof service)['dataSource'],
    );
  });

  describe('create', () => {
    it('should create a workflow', async () => {
      workflowRepo.save.mockImplementation((w: Workflow) => {
        w.id = 'workflow-1';
        w.createdAt = new Date();
        w.updatedAt = new Date();
        w.isActive = false;
        w.status = 'draft';
        return Promise.resolve(w);
      });

      const result = await service.create('tenant-1', { name: 'Welcome Series' });
      expect(result.id).toBe('workflow-1');
      expect(result.name).toBe('Welcome Series');
      expect(result.tenantId).toBe('tenant-1');
      expect(result.isActive).toBe(false);
      expect(result.status).toBe('draft');
    });
  });

  describe('findById', () => {
    it('should return workflow by id', async () => {
      workflowRepo.findById.mockResolvedValue({
        id: 'workflow-1',
        tenantId: 'tenant-1',
        name: 'Welcome',
        isActive: false,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.findById('tenant-1', 'workflow-1');
      expect(result.id).toBe('workflow-1');
    });

    it('should throw NotFoundException for wrong tenant', async () => {
      workflowRepo.findById.mockResolvedValue({
        id: 'workflow-1',
        tenantId: 'tenant-2',
      });

      await expect(service.findById('tenant-1', 'workflow-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for missing workflow', async () => {
      workflowRepo.findById.mockResolvedValue(null);

      await expect(service.findById('tenant-1', 'workflow-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete an inactive workflow', async () => {
      workflowRepo.findById.mockResolvedValue({
        id: 'workflow-1',
        tenantId: 'tenant-1',
        isActive: false,
      });

      await service.delete('tenant-1', 'workflow-1');
      expect(workflowRepo.delete).toHaveBeenCalledWith('workflow-1');
    });

    it('should reject deleting an active workflow', async () => {
      workflowRepo.findById.mockResolvedValue({
        id: 'workflow-1',
        tenantId: 'tenant-1',
        isActive: true,
      });

      await expect(service.delete('tenant-1', 'workflow-1')).rejects.toThrow(
        'Cannot delete an active workflow',
      );
    });
  });

  describe('deactivate', () => {
    it('should deactivate an active workflow', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        tenantId: 'tenant-1',
        isActive: true,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'Welcome',
      };
      workflowRepo.findById.mockResolvedValue(mockWorkflow);
      workflowRepo.save.mockImplementation((w: Workflow) => Promise.resolve(w));

      const result = await service.deactivate('tenant-1', 'workflow-1');
      expect(result.isActive).toBe(false);
      expect(result.status).toBe('paused');
    });

    it('should be idempotent for inactive workflow', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        tenantId: 'tenant-1',
        isActive: false,
        status: 'paused',
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'Welcome',
      };
      workflowRepo.findById.mockResolvedValue(mockWorkflow);

      const result = await service.deactivate('tenant-1', 'workflow-1');
      expect(result.isActive).toBe(false);
      expect(workflowRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('activate', () => {
    const mockWorkflow = {
      id: 'workflow-1',
      tenantId: 'tenant-1',
      name: 'Welcome',
      isActive: false,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should throw BadRequestException if activating without triggers', async () => {
      workflowRepo.findById.mockResolvedValue({ ...mockWorkflow });
      triggerRepo.findByWorkflowId.mockResolvedValue([]);

      await expect(service.activate('tenant-1', 'workflow-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if activating without steps', async () => {
      workflowRepo.findById.mockResolvedValue({ ...mockWorkflow });
      triggerRepo.findByWorkflowId.mockResolvedValue([{ id: 'trigger-1' }]);
      stepRepo.findByWorkflowId.mockResolvedValue([]);

      await expect(service.activate('tenant-1', 'workflow-1')).rejects.toThrow(BadRequestException);
    });

    it('should activate successfully if valid triggers and steps exist', async () => {
      workflowRepo.findById.mockResolvedValue({ ...mockWorkflow });
      triggerRepo.findByWorkflowId.mockResolvedValue([{ id: 'trigger-1' }]);
      stepRepo.findByWorkflowId.mockResolvedValue([
        { id: 'step-1', action: 'send_email', position: 0, config: { templateId: 't1' } },
      ]);
      workflowRepo.save.mockImplementation((w: Workflow) => Promise.resolve(w));

      const result = await service.activate('tenant-1', 'workflow-1');
      expect(result.isActive).toBe(true);
      expect(result.status).toBe('active');
      expect(result.activatedAt).toBeDefined();
    });

    it('should fail if final step is delay', async () => {
      workflowRepo.findById.mockResolvedValue({ ...mockWorkflow });
      triggerRepo.findByWorkflowId.mockResolvedValue([{ id: 'trigger-1' }]);
      stepRepo.findByWorkflowId.mockResolvedValue([
        { id: 'step-1', action: 'delay', position: 0, config: { amount: 10, unit: 'minutes' } },
      ]);

      await expect(service.activate('tenant-1', 'workflow-1')).rejects.toThrow(
        'A delay cannot be the final step in a workflow',
      );
    });

    it('should fail if delay step is missing amount/unit', async () => {
      workflowRepo.findById.mockResolvedValue({ ...mockWorkflow });
      triggerRepo.findByWorkflowId.mockResolvedValue([{ id: 'trigger-1' }]);
      stepRepo.findByWorkflowId.mockResolvedValue([
        { id: 'step-1', action: 'delay', position: 0, config: {} },
        { id: 'step-2', action: 'send_email', position: 1, config: { templateId: 't1' } },
      ]);

      await expect(service.activate('tenant-1', 'workflow-1')).rejects.toThrow(
        'Delay step step-1 requires amount and unit',
      );
    });

    it('should fail if conditional_split step is missing routing', async () => {
      workflowRepo.findById.mockResolvedValue({ ...mockWorkflow });
      triggerRepo.findByWorkflowId.mockResolvedValue([{ id: 'trigger-1' }]);
      stepRepo.findByWorkflowId.mockResolvedValue([
        { id: 'step-1', action: 'conditional_split', position: 0 },
      ]);

      await expect(service.activate('tenant-1', 'workflow-1')).rejects.toThrow(
        'must have both true and false step routing',
      );
    });

    it('should fail if email step is missing template config', async () => {
      workflowRepo.findById.mockResolvedValue({ ...mockWorkflow });
      triggerRepo.findByWorkflowId.mockResolvedValue([{ id: 'trigger-1' }]);
      stepRepo.findByWorkflowId.mockResolvedValue([
        { id: 'step-1', action: 'send_email', position: 0, config: {} },
      ]);

      await expect(service.activate('tenant-1', 'workflow-1')).rejects.toThrow(
        'requires either templateId OR (subject and html)',
      );
    });

    it('should fail if tag step is missing tagId', async () => {
      workflowRepo.findById.mockResolvedValue({ ...mockWorkflow });
      triggerRepo.findByWorkflowId.mockResolvedValue([{ id: 'trigger-1' }]);
      stepRepo.findByWorkflowId.mockResolvedValue([
        { id: 'step-1', action: 'attach_tag', position: 0, config: {} },
      ]);

      await expect(service.activate('tenant-1', 'workflow-1')).rejects.toThrow(
        'requires a tag reference',
      );
    });

    it('should fail if webhook step is missing url', async () => {
      workflowRepo.findById.mockResolvedValue({ ...mockWorkflow });
      triggerRepo.findByWorkflowId.mockResolvedValue([{ id: 'trigger-1' }]);
      stepRepo.findByWorkflowId.mockResolvedValue([
        { id: 'step-1', action: 'webhook', position: 0, config: {} },
      ]);

      await expect(service.activate('tenant-1', 'workflow-1')).rejects.toThrow(
        'requires a valid URL',
      );
    });
  });

  describe('reorderSteps', () => {
    it('should update positions of steps when complete match provided', async () => {
      workflowRepo.findById.mockResolvedValue({
        id: 'workflow-1',
        tenantId: 'tenant-1',
        isActive: false,
      });
      const step1 = { id: 'step-1', position: 0 } as WorkflowStep;
      const step2 = { id: 'step-2', position: 1 } as WorkflowStep;
      stepRepo.findByWorkflowId.mockResolvedValue([step1, step2]);
      stepRepo.save.mockImplementation((s: WorkflowStep) => Promise.resolve(s));

      await service.reorderSteps('tenant-1', 'workflow-1', { stepIds: ['step-2', 'step-1'] });

      expect(step2.position).toBe(0);
      expect(step1.position).toBe(1);
    });

    it('should reject partial lists for reorder', async () => {
      workflowRepo.findById.mockResolvedValue({
        id: 'workflow-1',
        tenantId: 'tenant-1',
        isActive: false,
      });
      const step1 = { id: 'step-1', position: 0 } as WorkflowStep;
      const step2 = { id: 'step-2', position: 1 } as WorkflowStep;
      stepRepo.findByWorkflowId.mockResolvedValue([step1, step2]);

      await expect(
        service.reorderSteps('tenant-1', 'workflow-1', { stepIds: ['step-1'] }),
      ).rejects.toThrow('Reorder list must contain all workflow steps exactly once');
    });

    it('should reject duplicate step IDs', async () => {
      workflowRepo.findById.mockResolvedValue({
        id: 'workflow-1',
        tenantId: 'tenant-1',
        isActive: false,
      });
      const step1 = { id: 'step-1', position: 0 } as WorkflowStep;
      const step2 = { id: 'step-2', position: 1 } as WorkflowStep;
      stepRepo.findByWorkflowId.mockResolvedValue([step1, step2]);

      await expect(
        service.reorderSteps('tenant-1', 'workflow-1', { stepIds: ['step-1', 'step-1'] }),
      ).rejects.toThrow('Reorder list must not contain duplicate step IDs');
    });
  });

  describe('structural rules', () => {
    it('should reject addTrigger if workflow is active', async () => {
      workflowRepo.findById.mockResolvedValue({
        id: 'workflow-1',
        tenantId: 'tenant-1',
        isActive: true,
      });
      await expect(
        service.addTrigger('tenant-1', 'workflow-1', { event: 'contact.subscribed' }),
      ).rejects.toThrow('Cannot modify structural fields of an active workflow');
    });

    it('should reject parentWorkflowStepId if it belongs to different workflow', async () => {
      workflowRepo.findById.mockResolvedValue({
        id: 'workflow-1',
        tenantId: 'tenant-1',
        isActive: false,
      });
      stepRepo.findByWorkflowId.mockResolvedValue([{ id: 'step-1' }]);

      await expect(
        service.addStep('tenant-1', 'workflow-1', {
          action: 'send_email',
          parentWorkflowStepId: 'unknown-id',
        }),
      ).rejects.toThrow('Parent step must belong to the same workflow');
    });
  });

  describe('findStep', () => {
    it('should return a step by id', async () => {
      workflowRepo.findById.mockResolvedValue({
        id: 'workflow-1',
        tenantId: 'tenant-1',
      });
      stepRepo.findByWorkflowId.mockResolvedValue([
        {
          id: 'step-1',
          tenantId: 'tenant-1',
          workflowId: 'workflow-1',
          action: 'send_email',
          position: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.findStep('tenant-1', 'workflow-1', 'step-1');
      expect(result.id).toBe('step-1');
    });

    it('should throw NotFoundException for missing step', async () => {
      workflowRepo.findById.mockResolvedValue({
        id: 'workflow-1',
        tenantId: 'tenant-1',
      });
      stepRepo.findByWorkflowId.mockResolvedValue([]);

      await expect(service.findStep('tenant-1', 'workflow-1', 'step-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('exit conditions', () => {
    it('should get exit conditions for a workflow', async () => {
      workflowRepo.findById.mockResolvedValue({
        id: 'workflow-1',
        tenantId: 'tenant-1',
      });
      exitConditionRepo.findByWorkflowId.mockResolvedValue([
        {
          id: 'ec-1',
          tenantId: 'tenant-1',
          workflowId: 'workflow-1',
          type: 'tag',
          resource: 'unsubscribed',
          operator: 'equals',
          value: 'true',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.getExitConditions('tenant-1', 'workflow-1');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('tag');
    });

    it('should replace exit conditions', async () => {
      workflowRepo.findById.mockResolvedValue({
        id: 'workflow-1',
        tenantId: 'tenant-1',
        isActive: false,
      });
      exitConditionRepo.deleteByWorkflowId.mockResolvedValue(undefined);
      exitConditionRepo.save.mockImplementation((conditions: WorkflowExitCondition[]) => {
        return Promise.resolve(
          conditions.map((c) => {
            c.id = 'ec-new';
            c.createdAt = new Date();
            c.updatedAt = new Date();
            return c;
          }),
        );
      });

      const result = await service.replaceExitConditions('tenant-1', 'workflow-1', [
        { type: 'tag', resource: 'unsubscribed', operator: 'equals', value: 'true' },
      ]);
      expect(result).toHaveLength(1);
      expect(exitConditionRepo.deleteByWorkflowId).toHaveBeenCalledWith('workflow-1');
    });

    it('should reject replacing exit conditions on active workflow', async () => {
      workflowRepo.findById.mockResolvedValue({
        id: 'workflow-1',
        tenantId: 'tenant-1',
        isActive: true,
      });

      await expect(
        service.replaceExitConditions('tenant-1', 'workflow-1', [
          { type: 'tag', resource: 'unsubscribed', operator: 'equals' },
        ]),
      ).rejects.toThrow('Cannot modify structural fields of an active workflow');
    });

    it('should add a single exit condition', async () => {
      workflowRepo.findById.mockResolvedValue({
        id: 'workflow-1',
        tenantId: 'tenant-1',
        isActive: false,
      });
      exitConditionRepo.save.mockImplementation((c: WorkflowExitCondition) => {
        c.id = 'ec-1';
        c.createdAt = new Date();
        c.updatedAt = new Date();
        return Promise.resolve(c);
      });

      const result = await service.addExitCondition('tenant-1', 'workflow-1', {
        type: 'tag',
        resource: 'unsubscribed',
        operator: 'equals',
        value: 'true',
      });
      expect(result.type).toBe('tag');
      expect(result.operator).toBe('equals');
    });

    it('should delete an exit condition', async () => {
      workflowRepo.findById.mockResolvedValue({
        id: 'workflow-1',
        tenantId: 'tenant-1',
        isActive: false,
      });
      exitConditionRepo.findByWorkflowId.mockResolvedValue([{ id: 'ec-1' }]);

      await service.deleteExitCondition('tenant-1', 'workflow-1', 'ec-1');
      expect(exitConditionRepo.delete).toHaveBeenCalledWith('ec-1');
    });

    it('should throw NotFoundException for missing exit condition on delete', async () => {
      workflowRepo.findById.mockResolvedValue({
        id: 'workflow-1',
        tenantId: 'tenant-1',
        isActive: false,
      });
      exitConditionRepo.findByWorkflowId.mockResolvedValue([]);

      await expect(service.deleteExitCondition('tenant-1', 'workflow-1', 'ec-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

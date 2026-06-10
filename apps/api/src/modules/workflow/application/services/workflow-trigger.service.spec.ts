import { describe, expect, it, beforeEach, vi, type Mock } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { WorkflowTriggerService } from './workflow-trigger.service';
import type { WorkflowTrigger } from '../../domain/aggregates/workflow-trigger.aggregate';
import type { WorkflowService } from './workflow.service';

describe('WorkflowTriggerService', () => {
  let service: WorkflowTriggerService;
  let triggerRepo: { findByWorkflowId: Mock; save: Mock; delete: Mock };
  let workflowService: { verifyWorkflowInactive: Mock };

  beforeEach(() => {
    triggerRepo = {
      findByWorkflowId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    workflowService = {
      verifyWorkflowInactive: vi.fn(),
    };

    service = new WorkflowTriggerService(
      triggerRepo as unknown as (typeof service)['triggerRepo'],
      workflowService as unknown as WorkflowService,
    );
  });

  describe('structural rules', () => {
    it('should reject addTrigger if workflow is active', async () => {
      workflowService.verifyWorkflowInactive.mockRejectedValue(
        new Error('Cannot modify structural fields of an active workflow'),
      );

      await expect(
        service.addTrigger('tenant-1', 'workflow-1', { event: 'contact.subscribed' }),
      ).rejects.toThrow('Cannot modify structural fields of an active workflow');
    });

    it('should add trigger successfully', async () => {
      workflowService.verifyWorkflowInactive.mockResolvedValue(undefined);
      triggerRepo.save.mockImplementation((t: WorkflowTrigger) => {
        t.id = 'trigger-1';
        t.createdAt = new Date();
        t.updatedAt = new Date();
        return Promise.resolve(t);
      });

      const result = await service.addTrigger('tenant-1', 'workflow-1', {
        event: 'contact.subscribed',
      });
      expect(result.id).toBe('trigger-1');
      expect(result.event).toBe('contact.subscribed');
    });

    it('should delete trigger successfully', async () => {
      workflowService.verifyWorkflowInactive.mockResolvedValue(undefined);
      triggerRepo.findByWorkflowId.mockResolvedValue([{ id: 'trigger-1' }]);

      await service.deleteTrigger('tenant-1', 'workflow-1', 'trigger-1');
      expect(triggerRepo.delete).toHaveBeenCalledWith('trigger-1');
    });

    it('should throw NotFoundException if deleting missing trigger', async () => {
      workflowService.verifyWorkflowInactive.mockResolvedValue(undefined);
      triggerRepo.findByWorkflowId.mockResolvedValue([]);

      await expect(service.deleteTrigger('tenant-1', 'workflow-1', 'trigger-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

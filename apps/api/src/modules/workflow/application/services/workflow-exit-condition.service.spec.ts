import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import type { Workflow } from '../../domain/aggregates/workflow.aggregate';
import type { WorkflowExitCondition } from '../../domain/aggregates/workflow-exit-condition.aggregate';
import type { WorkflowService } from './workflow.service';
import { WorkflowExitConditionService } from './workflow-exit-condition.service';

describe('WorkflowExitConditionService', () => {
  let service: WorkflowExitConditionService;
  let exitConditionRepo: {
    findByWorkflowId: Mock;
    save: Mock;
    delete: Mock;
    deleteByWorkflowId: Mock;
  };
  let workflowService: { verifyWorkflowInactive: Mock; getWorkflowOrThrow: Mock };

  beforeEach(() => {
    exitConditionRepo = {
      findByWorkflowId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      deleteByWorkflowId: vi.fn(),
    };
    workflowService = {
      verifyWorkflowInactive: vi.fn(),
      getWorkflowOrThrow: vi.fn(),
    };

    service = new WorkflowExitConditionService(
      exitConditionRepo as unknown as (typeof service)['exitConditionRepo'],
      workflowService as unknown as WorkflowService,
    );
  });

  describe('exit conditions', () => {
    it('should get exit conditions for a workflow', async () => {
      workflowService.getWorkflowOrThrow.mockResolvedValue({ id: 'workflow-1' } as Workflow);
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
      workflowService.verifyWorkflowInactive.mockResolvedValue(undefined);
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

    it('should add a single exit condition', async () => {
      workflowService.verifyWorkflowInactive.mockResolvedValue(undefined);
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
      workflowService.verifyWorkflowInactive.mockResolvedValue(undefined);
      exitConditionRepo.findByWorkflowId.mockResolvedValue([{ id: 'ec-1' }]);

      await service.deleteExitCondition('tenant-1', 'workflow-1', 'ec-1');
      expect(exitConditionRepo.delete).toHaveBeenCalledWith('ec-1');
    });

    it('should throw NotFoundException for missing exit condition on delete', async () => {
      workflowService.verifyWorkflowInactive.mockResolvedValue(undefined);
      exitConditionRepo.findByWorkflowId.mockResolvedValue([]);

      await expect(service.deleteExitCondition('tenant-1', 'workflow-1', 'ec-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

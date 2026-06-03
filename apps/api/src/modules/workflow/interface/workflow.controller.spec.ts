import { describe, expect, it, beforeEach, vi, type Mock } from 'vitest';
import { WorkflowController } from './workflow.controller';
import type { WorkflowService } from '../application/services/workflow.service';
import type { WorkflowResponse } from '@email-automation-engine/shared';

describe('WorkflowController', () => {
  let controller: WorkflowController;
  let service: {
    create: Mock;
    findByTenantId: Mock;
    findById: Mock;
    update: Mock;
    activate: Mock;
    deactivate: Mock;
    delete: Mock;
    addTrigger: Mock;
    updateTrigger: Mock;
    deleteTrigger: Mock;
    addStep: Mock;
    findStep: Mock;
    updateStep: Mock;
    deleteStep: Mock;
    reorderSteps: Mock;
    getExitConditions: Mock;
    replaceExitConditions: Mock;
    addExitCondition: Mock;
    updateExitCondition: Mock;
    deleteExitCondition: Mock;
  };

  beforeEach(() => {
    service = {
      create: vi.fn(),
      findByTenantId: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      activate: vi.fn(),
      deactivate: vi.fn(),
      delete: vi.fn(),
      addTrigger: vi.fn(),
      updateTrigger: vi.fn(),
      deleteTrigger: vi.fn(),
      addStep: vi.fn(),
      findStep: vi.fn(),
      updateStep: vi.fn(),
      deleteStep: vi.fn(),
      reorderSteps: vi.fn(),
      getExitConditions: vi.fn(),
      replaceExitConditions: vi.fn(),
      addExitCondition: vi.fn(),
      updateExitCondition: vi.fn(),
      deleteExitCondition: vi.fn(),
    };
    controller = new WorkflowController(service as unknown as WorkflowService);
  });

  describe('create', () => {
    it('should create a workflow', async () => {
      const mockResponse: WorkflowResponse = {
        id: 'workflow-1',
        tenantId: 'tenant-1',
        name: 'Welcome',
        isActive: false,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      service.create.mockResolvedValue(mockResponse);

      const result = await controller.create('tenant-1', { name: 'Welcome' });
      expect(result).toEqual(mockResponse);
      expect(service.create).toHaveBeenCalledWith('tenant-1', { name: 'Welcome' });
    });
  });

  describe('findStep', () => {
    it('should delegate to service findStep', async () => {
      const mockStep = { id: 'step-1', action: 'send_email' };
      service.findStep.mockResolvedValue(mockStep);

      const result = await controller.findStep('tenant-1', 'workflow-1', 'step-1');
      expect(result).toEqual(mockStep);
      expect(service.findStep).toHaveBeenCalledWith('tenant-1', 'workflow-1', 'step-1');
    });
  });

  describe('exit conditions', () => {
    it('should delegate getExitConditions to service', async () => {
      service.getExitConditions.mockResolvedValue([]);

      const result = await controller.getExitConditions('tenant-1', 'workflow-1');
      expect(result).toEqual([]);
      expect(service.getExitConditions).toHaveBeenCalledWith('tenant-1', 'workflow-1');
    });

    it('should delegate replaceExitConditions to service', async () => {
      const dtos = [{ type: 'tag', resource: 'unsubscribed', operator: 'equals', value: 'true' }];
      service.replaceExitConditions.mockResolvedValue([]);

      const result = await controller.replaceExitConditions('tenant-1', 'workflow-1', dtos);
      expect(result).toEqual([]);
      expect(service.replaceExitConditions).toHaveBeenCalledWith('tenant-1', 'workflow-1', dtos);
    });
  });
});

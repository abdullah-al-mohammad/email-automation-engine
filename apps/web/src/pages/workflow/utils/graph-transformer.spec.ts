import { describe, it, expect } from 'vitest';
import { generateWorkflowGraph } from './graph-transformer';
import { type WorkflowStepResponse, type WorkflowTriggerResponse } from '@email-automation-engine/shared';

describe('graph-transformer', () => {
  it('should transform a simple workflow with trigger and no steps', () => {
    const trigger: WorkflowTriggerResponse = {
      id: 'trigger-1',
      tenantId: 'tenant-1',
      workflowId: 'wf-1',
      event: 'contact_created',
      filters: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = generateWorkflowGraph([trigger], []);

    expect(result.nodes).toHaveLength(1);
    expect(result.edges).toHaveLength(0);
    
    const triggerNode = result.nodes[0];
    expect(triggerNode).toBeDefined();
    expect(triggerNode!.id).toBe('trigger-trigger-1');
    expect(triggerNode!.type).toBe('triggerNode');
  });

  it('should transform a linear workflow with trigger and steps', () => {
    const trigger: WorkflowTriggerResponse = {
      id: 'trigger-1',
      tenantId: 'tenant-1',
      workflowId: 'wf-1',
      event: 'contact_created',
      filters: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const steps: WorkflowStepResponse[] = [
      {
        id: 'step-1',
        tenantId: 'tenant-1',
        workflowId: 'wf-1',
        parentWorkflowStepId: null,
        action: 'delay',
        position: 0,
        config: { durationValue: 1, durationUnit: 'days' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'step-2',
        tenantId: 'tenant-1',
        workflowId: 'wf-1',
        parentWorkflowStepId: 'step-1',
        action: 'send_email',
        position: 1,
        config: { templateId: 'tpl-1' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    const result = generateWorkflowGraph([trigger], steps);

    expect(result.nodes).toHaveLength(3); // 1 trigger + 2 steps
    expect(result.edges).toHaveLength(2); // trigger -> step-1 -> step-2

    // Check Trigger Node
    expect(result.nodes.find(n => n.id === 'trigger-trigger-1')).toBeDefined();
    
    // Check Edges
    expect(result.edges.find(e => e.source === 'trigger-trigger-1' && e.target === 'step-step-1')).toBeDefined();
    expect(result.edges.find(e => e.source === 'step-step-1' && e.target === 'step-step-2')).toBeDefined();

    // Check positions (Dagre layout should assign coordinates)
    const step1Node = result.nodes.find(n => n.id === 'step-step-1')!;
    expect(step1Node.position.x).toBeDefined();
    expect(step1Node.position.y).toBeDefined();
  });
});

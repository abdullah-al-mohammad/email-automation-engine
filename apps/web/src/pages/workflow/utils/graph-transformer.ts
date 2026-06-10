import { type WorkflowTriggerResponse, type WorkflowStepResponse } from '@email-automation-engine/shared';
import { type Node, type Edge } from '@xyflow/react';
import dagre from 'dagre';

const nodeWidth = 280;
const nodeHeight = 80;

export function generateWorkflowGraph(
  triggers: WorkflowTriggerResponse[],
  steps: WorkflowStepResponse[]
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 80 });

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // 1. Add Triggers
  // Multiple triggers all point to the first step (or an implicit start node if there are no steps)
  // To keep it simple, if multiple triggers exist, we link them to a dummy "Start" node or just straight to first step
  // Let's find the first step (step without parent)
  const firstStep = steps.find(s => !s.parentWorkflowStepId);

  triggers.forEach((trigger, idx) => {
    const id = `trigger-${trigger.id}`;
    nodes.push({
      id,
      type: 'triggerNode',
      position: { x: 0, y: 0 },
      data: { trigger, isFirst: idx === 0 },
    });
    dagreGraph.setNode(id, { width: nodeWidth, height: nodeHeight });

    if (firstStep) {
      edges.push({
        id: `edge-${id}-${firstStep.id}`,
        source: id,
        target: `step-${firstStep.id}`,
        type: 'smoothstep',
      });
      dagreGraph.setEdge(id, `step-${firstStep.id}`);
    }
  });

  // 2. Add Steps
  steps.forEach((step) => {
    const id = `step-${step.id}`;
    nodes.push({
      id,
      type: 'stepNode',
      position: { x: 0, y: 0 },
      data: { step },
    });
    dagreGraph.setNode(id, { width: nodeWidth, height: nodeHeight });

    // Link based on conditional vs linear
    if (step.action === 'conditional_split') {
      if (step.trueStepId) {
        edges.push({
          id: `edge-true-${id}-${step.trueStepId}`,
          source: id,
          target: `step-${step.trueStepId}`,
          sourceHandle: 'true',
          label: 'True',
          type: 'smoothstep',
        });
        dagreGraph.setEdge(id, `step-${step.trueStepId}`);
      }
      if (step.falseStepId) {
        edges.push({
          id: `edge-false-${id}-${step.falseStepId}`,
          source: id,
          target: `step-${step.falseStepId}`,
          sourceHandle: 'false',
          label: 'False',
          type: 'smoothstep',
        });
        dagreGraph.setEdge(id, `step-${step.falseStepId}`);
      }
    } else {
      // Find the next linear step (the step whose parent is this step)
      // Note: A conditional split doesn't have a linear next step. Its children are set via trueStepId/falseStepId.
      const nextStep = steps.find(s => s.parentWorkflowStepId === step.id);
      if (nextStep) {
        edges.push({
          id: `edge-${id}-${nextStep.id}`,
          source: id,
          target: `step-${nextStep.id}`,
          type: 'smoothstep',
        });
        dagreGraph.setEdge(id, `step-${nextStep.id}`);
      }
    }
  });

  // 3. Layout the graph
  dagre.layout(dagreGraph);

  // Apply positions
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

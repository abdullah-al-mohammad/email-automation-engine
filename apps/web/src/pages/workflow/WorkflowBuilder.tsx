import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTenant } from '../../contexts/TenantContext';
import api from '../../lib/api';
import {
  type WorkflowResponse,
  type WorkflowStepResponse,
  type WorkflowTriggerResponse,
} from '@email-automation-engine/shared';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEffect, useState, useCallback, type MouseEvent } from 'react';
import { generateWorkflowGraph } from './utils/graph-transformer';
import { Trigger as TriggerNode } from '../../components/workflow/nodes/Trigger';
import { Step as StepNode } from '../../components/workflow/nodes/Step';
import Sidebar from '../../components/workflow/sidebar/Sidebar';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const nodeTypes = {
  triggerNode: TriggerNode,
  stepNode: StepNode,
};

export default function WorkflowBuilder() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();

  const [selectedNode, setSelectedNode] = useState<
    | { type: 'trigger'; data: WorkflowTriggerResponse }
    | { type: 'step'; data: WorkflowStepResponse }
    | null
  >(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { data: workflow, isLoading: isLoadingWorkflow } = useQuery({
    queryKey: ['workflow', currentTenant?.id, workflowId],
    queryFn: async () => {
      const res = await api.get<WorkflowResponse>(
        `/tenants/${currentTenant?.id}/workflows/${workflowId}`,
      );
      return res.data;
    },
    enabled: !!currentTenant && !!workflowId,
  });

  const { data: triggers = [], isLoading: isLoadingTriggers } = useQuery({
    queryKey: ['workflow-triggers', currentTenant?.id, workflowId],
    queryFn: async () => {
      const res = await api.get<WorkflowTriggerResponse[]>(
        `/tenants/${currentTenant?.id}/workflows/${workflowId}/triggers`,
      );
      return res.data;
    },
    enabled: !!currentTenant && !!workflowId,
  });

  const { data: steps = [], isLoading: isLoadingSteps } = useQuery({
    queryKey: ['workflow-steps', currentTenant?.id, workflowId],
    queryFn: async () => {
      const res = await api.get<WorkflowStepResponse[]>(
        `/tenants/${currentTenant?.id}/workflows/${workflowId}/steps`,
      );
      return res.data;
    },
    enabled: !!currentTenant && !!workflowId,
  });

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    if (triggers.length >= 0 && steps.length >= 0) {
      const graph = generateWorkflowGraph(triggers, steps);
      setNodes(graph.nodes);
      setEdges(graph.edges);
    }
  }, [triggers, steps]);

  const addStepMutation = useMutation({
    mutationFn: async () => {
      // Find the last linear step to append to.
      // If none, append to null (first step)
      let parentId: string | undefined;
      if (steps.length > 0) {
        // Just grab the last created step for simplicity
        parentId = steps[steps.length - 1]?.id;
      }

      const res = await api.post<WorkflowStepResponse>(
        `/tenants/${currentTenant?.id}/workflows/${workflowId}/steps`,
        {
          action: 'delay',
          config: { durationValue: 1, durationUnit: 'days' },
          parentWorkflowStepId: parentId,
        },
      );
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['workflow-steps', currentTenant?.id, workflowId],
      });
    },
  });

  const onNodeClick = useCallback((_: MouseEvent, node: Node) => {
    if (node.type === 'triggerNode') {
      setSelectedNode({
        type: 'trigger',
        data: node.data.trigger as WorkflowTriggerResponse,
      });
    } else {
      setSelectedNode({
        type: 'step',
        data: node.data.step as WorkflowStepResponse,
      });
    }
    setIsSidebarOpen(true);
  }, []);

  const onPaneClick = useCallback(() => {
    setIsSidebarOpen(false);
    setSelectedNode(null);
  }, []);

  const isLoading = isLoadingWorkflow || isLoadingTriggers || isLoadingSteps;

  if (isLoading) {
    return <div className="p-8">Loading workflow...</div>;
  }

  if (!workflow) {
    return <div className="p-8">Workflow not found.</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-6">
      {/* Header bar */}
      <div className="h-14 border-b bg-white dark:bg-zinc-900 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to="/workflows"
            className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            &larr; Back
          </Link>
          <div className="h-4 w-px bg-gray-300 dark:bg-zinc-700" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {workflow.name}
          </h2>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              workflow.isActive
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-300'
            }`}
          >
            {workflow.isActive ? 'Active' : 'Draft'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-3 py-1.5 border border-gray-300 dark:border-zinc-700 rounded-md shadow-sm text-sm font-medium bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700">
            Settings
          </button>
          <button className="px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
            {workflow.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 w-full h-full bg-gray-50/50 dark:bg-zinc-950/50 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-dot-pattern"
          proOptions={{ hideAttribution: true }}
          nodesDraggable={!workflow.isActive}
          nodesConnectable={false}
          elementsSelectable={true}
        >
          <Background color="#ccc" gap={16} />
          <Controls />
        </ReactFlow>

        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          selectedNode={selectedNode}
          workflowId={workflowId as string}
          isActive={workflow.isActive}
        />

        {!workflow.isActive && (
          <button
            onClick={() => addStepMutation.mutate()}
            disabled={addStepMutation.isPending}
            className="absolute bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-indigo-700 transition-transform hover:scale-105 z-10 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

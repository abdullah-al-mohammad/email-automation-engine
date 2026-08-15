import { type WorkflowResponse } from '@email-automation-engine/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import Confirm from '../../components/modals/Confirm';
import EmptyState from '../../components/shared/EmptyState';
import WorkflowsList from '../../components/workflow/Workflows';
import WorkflowsHeader from '../../components/workflow/WorkflowsHeader';
import { useTenant } from '../../contexts/TenantContext';
import api from '../../lib/api';
export default function Workflows() {
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['workflows', currentTenant?.id],
    queryFn: async () => {
      const res = await api.get<WorkflowResponse[]>(`/tenants/${currentTenant?.id}/workflows`);
      return res.data;
    },
    enabled: !!currentTenant,
  });

  const deleteMutation = useMutation({
    mutationFn: async (workflowId: string) => {
      await api.delete(`/tenants/${currentTenant?.id}/workflows/${workflowId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workflows', currentTenant?.id] });
      setWorkflowToDelete(null);
    },
  });

  return (
    <div className="space-y-6">
      <WorkflowsHeader />

      {isLoading ? (
        <div className="py-12 text-center text-gray-500 dark:text-zinc-400">
          Loading workflows...
        </div>
      ) : workflows.length === 0 ? (
        <EmptyState title="No workflows" description="Get started by creating a new workflow." />
      ) : (
        <WorkflowsList workflows={workflows} onDelete={(id: string) => setWorkflowToDelete(id)} />
      )}

      <Confirm
        isOpen={!!workflowToDelete}
        onClose={() => setWorkflowToDelete(null)}
        onConfirm={() => workflowToDelete && deleteMutation.mutate(workflowToDelete)}
        title="Delete workflow"
        description="Are you sure you want to delete this workflow? This action cannot be undone and all associated data will be permanently removed."
        confirmText="Delete workflow"
        isConfirming={deleteMutation.isPending}
      />
    </div>
  );
}

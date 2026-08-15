import {
  type CreateWorkflowDto,
  CreateWorkflowSchema,
  type WorkflowResponse,
} from '@email-automation-engine/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { useTenant } from '../../contexts/TenantContext';
import api from '../../lib/api';

export default function EditWorkflow() {
  const { currentTenant } = useTenant();
  const navigate = useNavigate();
  const { workflowId } = useParams<{ workflowId: string }>();
  const queryClient = useQueryClient();

  const { data: workflow, isLoading } = useQuery({
    queryKey: ['workflow', currentTenant?.id, workflowId],
    queryFn: async () => {
      const res = await api.get<WorkflowResponse>(
        `/tenants/${currentTenant?.id}/workflows/${workflowId}`,
      );
      return res.data;
    },
    enabled: !!currentTenant && !!workflowId,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateWorkflowDto>({
    resolver: zodResolver(CreateWorkflowSchema),
  });

  useEffect(() => {
    if (workflow) {
      reset({
        name: workflow.name,
        description: workflow.description || '',
      });
    }
  }, [workflow, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: CreateWorkflowDto) => {
      const res = await api.patch<WorkflowResponse>(
        `/tenants/${currentTenant?.id}/workflows/${workflowId}`,
        data,
      );
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['workflow', currentTenant?.id, workflowId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['workflows', currentTenant?.id],
      });
      void navigate('/workflows');
    },
  });

  const onSubmit = (data: CreateWorkflowDto) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="py-12 max-w-2xl mx-auto text-center text-gray-500 dark:text-zinc-400">
        Loading workflow details...
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="py-12 max-w-2xl mx-auto text-center text-gray-500 dark:text-zinc-400">
        Workflow not found.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit workflow</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
          Update the name and description of your workflow.
        </p>
      </div>

      <form onSubmit={void handleSubmit(onSubmit)} className="space-y-4 max-w-md">
        <div>
          <label
            htmlFor="edit-workflow-name"
            className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1"
          >
            Name
          </label>
          <input
            id="edit-workflow-name"
            {...register('name')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Onboarding sequence"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name.message as string}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="edit-workflow-description"
            className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1"
          >
            Description (optional)
          </label>
          <textarea
            id="edit-workflow-description"
            {...register('description')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            rows={3}
            placeholder="What does this workflow do?"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-500">{errors.description.message as string}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting || updateMutation.isPending}
            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting || updateMutation.isPending ? 'Updating...' : 'Update workflow'}
          </button>
          <button
            type="button"
            onClick={() => void navigate('/workflows')}
            className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

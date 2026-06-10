import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { type WorkflowResponse, CreateWorkflowSchema, type CreateWorkflowDto } from '@email-automation-engine/shared';
import { useTenant } from '../../contexts/TenantContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../lib/api';

export default function WorkflowListPage() {
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['workflows', currentTenant?.id],
    queryFn: async () => {
      const res = await api.get<WorkflowResponse[]>(`/tenants/${currentTenant?.id}/workflows`);
      return res.data;
    },
    enabled: !!currentTenant,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateWorkflowDto>({
    resolver: zodResolver(CreateWorkflowSchema),
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateWorkflowDto) => {
      const res = await api.post(`/tenants/${currentTenant?.id}/workflows`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows', currentTenant?.id] });
      setIsCreateOpen(false);
      reset();
    },
  });

  const onSubmit = (data: CreateWorkflowDto) => {
    createMutation.mutate(data);
  };

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Workflows</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Manage your automated email sequences.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
        >
          Create Workflow
        </button>
      </div>

      {isCreateOpen && (
        <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">New Workflow</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Name</label>
              <input 
                {...register('name')} 
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Onboarding Sequence"
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Description (Optional)</label>
              <textarea 
                {...register('description')} 
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                rows={3}
                placeholder="What does this workflow do?"
              />
              {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
            </div>
            <div className="flex items-center gap-3">
              <button 
                type="submit" 
                disabled={isSubmitting || createMutation.isPending}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting || createMutation.isPending ? 'Creating...' : 'Create'}
              </button>
              <button 
                type="button" 
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-gray-500 dark:text-zinc-400">Loading workflows...</div>
      ) : workflows.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-xl">
          <div className="mx-auto w-12 h-12 text-gray-400 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">No workflows</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">Get started by creating a new workflow.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <ul className="divide-y divide-gray-200 dark:divide-zinc-800">
            {workflows.map((workflow) => (
              <li key={workflow.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                <Link to={`/workflows/${workflow.id}`} className="block p-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                          {workflow.name}
                        </p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          workflow.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}>
                          {workflow.isActive ? 'Active' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-zinc-400 truncate">
                        {workflow.description || 'No description provided'}
                      </p>
                    </div>
                    <div className="ml-5 flex-shrink-0">
                      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

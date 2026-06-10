import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type WorkflowStepResponse, SUPPORTED_STEP_ACTIONS, type TagResponse, type EmailTemplateResponse, type ContactResponse } from '@email-automation-engine/shared';
import { useTenant } from '../../../../contexts/TenantContext';
import { useQuery } from '@tanstack/react-query';
import api from '../../../../lib/api';

interface StepFormProps {
  step: WorkflowStepResponse;
  workflowId: string;
  isActive: boolean;
  onSuccess: () => void;
}

export default function StepForm({ step, workflowId, isActive, onSuccess }: StepFormProps) {
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm({
    defaultValues: {
      action: step.action,
      config: JSON.stringify(step.config, null, 2),
      // Individual fields for specific actions
      durationValue: (step.config as any)?.durationValue || 1,
      durationUnit: (step.config as any)?.durationUnit || 'days',
      templateId: (step.config as any)?.templateId || '',
      tagId: (step.config as any)?.tagId || '',
    }
  });

  const selectedAction = watch('action');

  // Load dependent data
  const { data: templates = [] } = useQuery({
    queryKey: ['email-templates', currentTenant?.id],
    queryFn: async () => {
      const res = await api.get<EmailTemplateResponse[]>(`/tenants/${currentTenant?.id}/email-templates`);
      return res.data;
    },
    enabled: !!currentTenant && selectedAction === 'send_email',
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['tags', currentTenant?.id],
    queryFn: async () => {
      const res = await api.get<TagResponse[]>(`/tenants/${currentTenant?.id}/tags`);
      return res.data;
    },
    enabled: !!currentTenant && (selectedAction === 'attach_tag' || selectedAction === 'detach_tag' || selectedAction === 'conditional_split'),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      let finalConfig = {};
      
      // Build config based on selected action
      if (data.action === 'delay') {
        finalConfig = { durationValue: Number(data.durationValue), durationUnit: data.durationUnit };
      } else if (data.action === 'send_email') {
        finalConfig = { templateId: data.templateId };
      } else if (data.action === 'attach_tag' || data.action === 'detach_tag') {
        finalConfig = { tagId: data.tagId };
      } else {
        try {
          finalConfig = JSON.parse(data.config || '{}');
        } catch(e) {}
      }

      const payload = {
        action: data.action,
        config: finalConfig,
      };
      const res = await api.patch(`/tenants/${currentTenant?.id}/workflows/${workflowId}/steps/${step.id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-steps', currentTenant?.id, workflowId] });
      onSuccess();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/tenants/${currentTenant?.id}/workflows/${workflowId}/steps/${step.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-steps', currentTenant?.id, workflowId] });
      onSuccess();
    }
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex flex-col h-full">
      <div className="flex-1 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Action Type</label>
          <select 
            {...register('action')} 
            disabled={isActive}
            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white disabled:opacity-50"
          >
            {SUPPORTED_STEP_ACTIONS.map(action => (
              <option key={action} value={action}>
                {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        {selectedAction === 'delay' && (
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Wait for</label>
              <input 
                type="number"
                {...register('durationValue')}
                disabled={isActive}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white disabled:opacity-50"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Time Unit</label>
              <select 
                {...register('durationUnit')}
                disabled={isActive}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white disabled:opacity-50"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
              </select>
            </div>
          </div>
        )}

        {selectedAction === 'send_email' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Email Template</label>
            <select 
              {...register('templateId')}
              disabled={isActive}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white disabled:opacity-50"
            >
              <option value="">Select a template...</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        {(selectedAction === 'attach_tag' || selectedAction === 'detach_tag') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Select Tag</label>
            <select 
              {...register('tagId')}
              disabled={isActive}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white disabled:opacity-50"
            >
              <option value="">Select a tag...</option>
              {tags.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        {(selectedAction === 'conditional_split' || selectedAction === 'webhook') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Configuration (JSON)</label>
            <textarea 
              {...register('config')} 
              disabled={isActive}
              rows={10}
              className="w-full font-mono text-sm px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white disabled:opacity-50"
              placeholder="{}"
            />
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-zinc-800 flex gap-3">
        <button 
          type="submit" 
          disabled={isActive || isSubmitting || updateMutation.isPending}
          className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
        <button 
          type="button" 
          onClick={() => deleteMutation.mutate()}
          disabled={isActive || deleteMutation.isPending}
          className="py-2 px-4 bg-white dark:bg-zinc-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </form>
  );
}

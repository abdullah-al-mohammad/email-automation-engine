import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type WorkflowTriggerResponse, SUPPORTED_TRIGGER_EVENTS } from '@email-automation-engine/shared';
import { useTenant } from '../../../../contexts/TenantContext';
import api from '../../../../lib/api';

interface TriggerFormProps {
  trigger: WorkflowTriggerResponse;
  workflowId: string;
  isActive: boolean;
  onSuccess: () => void;
}

export default function TriggerForm({ trigger, workflowId, isActive, onSuccess }: TriggerFormProps) {
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      event: trigger.event,
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.patch(`/tenants/${currentTenant?.id}/workflows/${workflowId}/triggers/${trigger.id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-triggers', currentTenant?.id, workflowId] });
      onSuccess();
    }
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Event Type</label>
        <select 
          {...register('event')} 
          disabled={isActive}
          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white disabled:opacity-50"
        >
          {SUPPORTED_TRIGGER_EVENTS.map(event => (
            <option key={event} value={event}>
              {event.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-zinc-800">
        <button 
          type="submit" 
          disabled={isActive || isSubmitting}
          className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Trigger'}
        </button>
      </div>
    </form>
  );
}

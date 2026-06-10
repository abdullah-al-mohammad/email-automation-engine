import { useForm, type UseFormRegister } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  type WorkflowTriggerResponse,
  SUPPORTED_TRIGGER_EVENTS,
  TRIGGER_EVENTS,
} from '@email-automation-engine/shared';
import { useTenant } from '../../../contexts/TenantContext';
import api from '../../../lib/api';

interface TriggerFormData {
  event: string;
}

interface TriggerFormProps {
  trigger: WorkflowTriggerResponse;
  workflowId: string;
  isActive: boolean;
  onSuccess: () => void;
}

const TRIGGER_EVENT_LABELS: Record<string, string> = {
  [TRIGGER_EVENTS.CONTACT_SUBSCRIBED]: 'Contact subscribed',
  [TRIGGER_EVENTS.CONTACT_UNSUBSCRIBED]: 'Contact unsubscribed',
  [TRIGGER_EVENTS.TAG_ATTACHED]: 'Tag attached',
  [TRIGGER_EVENTS.TAG_DETACHED]: 'Tag detached',
  [TRIGGER_EVENTS.EMAIL_SENT]: 'Email sent',
  [TRIGGER_EVENTS.EMAIL_DELIVERED]: 'Email delivered',
  [TRIGGER_EVENTS.EMAIL_BOUNCED]: 'Email bounced',
  [TRIGGER_EVENTS.EMAIL_COMPLAINED]: 'Email complained',
  [TRIGGER_EVENTS.EMAIL_OPENED]: 'Email opened',
  [TRIGGER_EVENTS.EMAIL_LINK_CLICKED]: 'Email link clicked',
};

function formatEventName(event: string) {
  return TRIGGER_EVENT_LABELS[event] || event;
}

export default function Trigger({
  trigger,
  workflowId,
  isActive,
  onSuccess,
}: TriggerFormProps) {
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();

  const { register, handleSubmit } = useForm<TriggerFormData>({
    defaultValues: { event: trigger.event },
  });

  const mutation = useMutation({
    mutationFn: async (data: TriggerFormData) => {
      const res = await api.patch<WorkflowTriggerResponse>(
        `/tenants/${currentTenant?.id}/workflows/${workflowId}/triggers/${trigger.id}`,
        data,
      );
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['workflow-triggers', currentTenant?.id, workflowId],
      });
      onSuccess();
    },
  });

  return (
    <form
      onSubmit={(e) => void handleSubmit((data) => mutation.mutate(data))(e)}
      className="space-y-4"
    >
      <TriggerEventSelect register={register} disabled={isActive} />
      <SaveButton disabled={isActive || mutation.isPending} isPending={mutation.isPending} />
    </form>
  );
}

interface TriggerEventSelectProps {
  register: UseFormRegister<TriggerFormData>;
  disabled: boolean;
}

function TriggerEventSelect({ register, disabled }: TriggerEventSelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
        Event type
      </label>
      <select
        {...register('event')}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white disabled:opacity-50"
      >
        {SUPPORTED_TRIGGER_EVENTS.map((event) => (
          <option key={event} value={event}>
            {formatEventName(event)}
          </option>
        ))}
      </select>
    </div>
  );
}

function SaveButton({ disabled, isPending }: { disabled: boolean; isPending: boolean }) {
  return (
    <div className="pt-4 border-t border-gray-200 dark:border-zinc-800">
      <button
        type="submit"
        disabled={disabled}
        className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Saving...' : 'Save trigger'}
      </button>
    </div>
  );
}

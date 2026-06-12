import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  type WorkflowStepResponse,
  STEP_ACTIONS,
  type TagResponse,
  type EmailTemplateResponse,
} from '@email-automation-engine/shared';
import { useTenant } from '../../../contexts/TenantContext';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';

export const STEP_ACTION_LABELS: Record<string, string> = {
  [STEP_ACTIONS.DELAY]: 'Delay',
  [STEP_ACTIONS.SEND_EMAIL]: 'Send email',
  [STEP_ACTIONS.ATTACH_TAG]: 'Attach tag',
  [STEP_ACTIONS.DETACH_TAG]: 'Detach tag',
  [STEP_ACTIONS.UNSUBSCRIBE_CONTACT]: 'Unsubscribe contact',
  [STEP_ACTIONS.DELETE_CONTACT]: 'Delete contact',
  [STEP_ACTIONS.CONDITIONAL_SPLIT]: 'Conditional split',
  [STEP_ACTIONS.WEBHOOK]: 'Webhook',
};

interface StepConfigPayload {
  amount?: number;
  unit?: string;
  templateId?: string;
  tagId?: string;
}

interface StepFormData {
  action: string;
  config: string;
  amount: number | string;
  unit: string;
  templateId: string;
  tagId: string;
}

interface StepFormProps {
  step: WorkflowStepResponse;
  workflowId: string;
  isActive: boolean;
  onSuccess: () => void;
}

export default function EditStep({ step, workflowId, isActive, onSuccess }: StepFormProps) {
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<StepFormData>({
    defaultValues: {
      action: step.action,
      config: JSON.stringify(step.config, null, 2),
      // Individual fields for specific actions
      amount: (step.config as StepConfigPayload)?.amount || 15,
      unit: (step.config as StepConfigPayload)?.unit || 'minutes',
      templateId: (step.config as StepConfigPayload)?.templateId || '',
      tagId: (step.config as StepConfigPayload)?.tagId || '',
    },
  });

  const selectedAction = watch('action');

  // Load dependent data
  const { data: templates = [] } = useQuery({
    queryKey: ['email-templates', currentTenant?.id],
    queryFn: async () => {
      const res = await api.get<EmailTemplateResponse[]>(
        `/tenants/${currentTenant?.id}/email-templates`,
      );
      return res.data;
    },
    enabled: !!currentTenant && selectedAction === STEP_ACTIONS.SEND_EMAIL,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['tags', currentTenant?.id],
    queryFn: async () => {
      const res = await api.get<TagResponse[]>(`/tenants/${currentTenant?.id}/tags`);
      return res.data;
    },
    enabled:
      !!currentTenant &&
      (selectedAction === STEP_ACTIONS.ATTACH_TAG ||
        selectedAction === STEP_ACTIONS.DETACH_TAG ||
        selectedAction === STEP_ACTIONS.CONDITIONAL_SPLIT),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: StepFormData) => {
      let finalConfig: Record<string, unknown> = {};

      // Build config based on selected action
      if (data.action === STEP_ACTIONS.DELAY) {
        finalConfig = {
          amount: Number(data.amount),
          unit: data.unit,
        };
      } else if (data.action === STEP_ACTIONS.SEND_EMAIL) {
        finalConfig = { templateId: data.templateId };
      } else if (
        data.action === STEP_ACTIONS.ATTACH_TAG ||
        data.action === STEP_ACTIONS.DETACH_TAG
      ) {
        finalConfig = { tagId: data.tagId };
      } else {
        try {
          finalConfig = JSON.parse(data.config || '{}') as Record<string, unknown>;
        } catch {
          /* ignore parsing error */
        }
      }

      const payload = {
        action: data.action,
        config: finalConfig,
      };
      const res = await api.patch<WorkflowStepResponse>(
        `/tenants/${currentTenant?.id}/workflows/${workflowId}/steps/${step.id}`,
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['workflow-steps', currentTenant?.id, workflowId],
      });
      onSuccess();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/tenants/${currentTenant?.id}/workflows/${workflowId}/steps/${step.id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['workflow-steps', currentTenant?.id, workflowId],
      });
      onSuccess();
    },
  });

  const onSubmit = (data: StepFormData) => {
    updateMutation.mutate(data);
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(onSubmit)(e)}
      className="space-y-4 flex flex-col h-full"
      noValidate
    >
      <div className="flex-1 space-y-4">
        <input type="hidden" {...register('action')} />

        {selectedAction === STEP_ACTIONS.DELAY && (
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                Wait for
              </label>
              <input
                type="number"
                {...register('amount', {
                  validate: (value) => {
                    const num = Number(value);
                    if (watch('unit') === 'minutes') {
                      if (num < 15) return 'Minimum 15 minutes';
                      if (num % 15 !== 0) return 'Must be a multiple of 15';
                    } else if (num < 1) {
                      return 'Must be at least 1';
                    }
                    return true;
                  },
                })}
                min={watch('unit') === 'minutes' ? 15 : 1}
                step={watch('unit') === 'minutes' ? 15 : 1}
                disabled={isActive}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white disabled:opacity-50 ${
                  errors.amount
                    ? 'border-red-300 dark:border-red-900 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 dark:border-zinc-700'
                }`}
              />
              {errors.amount && (
                <p className="mt-1 text-xs text-red-500">{errors.amount.message as string}</p>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                Time unit
              </label>
              <select
                {...register('unit')}
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

        {selectedAction === STEP_ACTIONS.SEND_EMAIL && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Email template
            </label>
            <select
              {...register('templateId')}
              disabled={isActive}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white disabled:opacity-50"
            >
              <option value="">Select a template...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {(selectedAction === STEP_ACTIONS.ATTACH_TAG ||
          selectedAction === STEP_ACTIONS.DETACH_TAG) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Select tag
            </label>
            <select
              {...register('tagId')}
              disabled={isActive}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white disabled:opacity-50"
            >
              <option value="">Select a tag...</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {(selectedAction === STEP_ACTIONS.CONDITIONAL_SPLIT ||
          selectedAction === STEP_ACTIONS.WEBHOOK) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Configuration (JSON)
            </label>
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

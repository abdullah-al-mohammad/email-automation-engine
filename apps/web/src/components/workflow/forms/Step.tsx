import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  type WorkflowStepResponse,
  SUPPORTED_STEP_ACTIONS,
  STEP_ACTIONS,
  type TagResponse,
  type EmailTemplateResponse,
} from '@email-automation-engine/shared';
import { useTenant } from '../../../contexts/TenantContext';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';

const STEP_ACTION_LABELS: Record<string, string> = {
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
  durationValue?: number;
  durationUnit?: string;
  templateId?: string;
  tagId?: string;
}

interface StepFormData {
  action: string;
  config: string;
  durationValue: number | string;
  durationUnit: string;
  templateId: string;
  tagId: string;
}

interface StepFormProps {
  step: WorkflowStepResponse;
  workflowId: string;
  isActive: boolean;
  onSuccess: () => void;
}

export default function Step({ step, workflowId, isActive, onSuccess }: StepFormProps) {
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm<StepFormData>({
    defaultValues: {
      action: step.action,
      config: JSON.stringify(step.config, null, 2),
      // Individual fields for specific actions
      durationValue: (step.config as StepConfigPayload)?.durationValue || 1,
      durationUnit: (step.config as StepConfigPayload)?.durationUnit || 'days',
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
          durationValue: Number(data.durationValue),
          durationUnit: data.durationUnit,
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
    >
      <div className="flex-1 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
            Action type
          </label>
          <select
            {...register('action')}
            disabled={isActive}
            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white disabled:opacity-50"
          >
            {SUPPORTED_STEP_ACTIONS.map((action) => (
              <option key={action} value={action}>
                {STEP_ACTION_LABELS[action] || action}
              </option>
            ))}
          </select>
        </div>

        {selectedAction === STEP_ACTIONS.DELAY && (
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                Wait for
              </label>
              <input
                type="number"
                {...register('durationValue')}
                disabled={isActive}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white disabled:opacity-50"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                Time unit
              </label>
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

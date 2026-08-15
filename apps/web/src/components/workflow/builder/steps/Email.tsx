import { type StepFormData } from '@email-automation-engine/shared';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import { useEmailTemplates } from '../../../../pages/workflow/hooks/useEmailTemplates';

interface EmailProps {
  register: UseFormRegister<StepFormData>;
  errors: FieldErrors<StepFormData>;
  isActive: boolean;
}

export default function Email({ register, errors, isActive }: EmailProps) {
  const { data: templates = [] } = useEmailTemplates();

  return (
    <div>
      <label
        htmlFor="email-template"
        className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1"
      >
        Email template
      </label>
      <select
        id="email-template"
        {...register('config.templateId')}
        disabled={isActive}
        className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white disabled:opacity-50 ${
          errors.config?.templateId
            ? 'border-red-300 dark:border-red-900 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 dark:border-zinc-700'
        }`}
      >
        <option value="">Select a template</option>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      {errors.config?.templateId && (
        <p className="mt-1 text-xs text-red-500">{errors.config.templateId.message as string}</p>
      )}
    </div>
  );
}

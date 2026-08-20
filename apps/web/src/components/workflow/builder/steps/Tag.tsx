import { type StepFormData } from '@email-automation-engine/shared';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import { useTags } from '../../../../pages/workflow/hooks/useTags';

interface TagProps {
  register: UseFormRegister<StepFormData>;
  errors: FieldErrors<StepFormData>;
  isActive: boolean;
}

export default function Tag({ register, errors, isActive }: TagProps) {
  const { data: tags = [] } = useTags();

  return (
    <div>
      <label
        htmlFor="tag-select"
        className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1"
      >
        Select tag
      </label>
      <select
        id="tag-select"
        {...register('config.tagId')}
        disabled={isActive}
        className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white disabled:opacity-50 ${
          errors.config?.tagId
            ? 'border-red-300 dark:border-red-900 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 dark:border-zinc-700'
        }`}
      >
        <option value="">Select a tag...</option>
        {tags.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      {errors.config?.tagId && (
        <p className="mt-1 text-xs text-red-500">{errors.config.tagId.message as string}</p>
      )}
    </div>
  );
}

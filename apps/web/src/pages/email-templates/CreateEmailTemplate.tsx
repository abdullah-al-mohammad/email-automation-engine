import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import {
  type EmailTemplateResponse,
  CreateEmailTemplateSchema,
  type CreateEmailTemplateDto,
} from '@email-automation-engine/shared';
import { useTenant } from '../../contexts/TenantContext';
import api from '../../lib/api';

export default function CreateEmailTemplate() {
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateEmailTemplateDto>({
    resolver: zodResolver(CreateEmailTemplateSchema),
    defaultValues: {
      html: '<h1>Hello {{contact.firstName}}</h1>',
      text: 'Hello {{contact.firstName}}',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateEmailTemplateDto) => {
      const res = await api.post<EmailTemplateResponse>(
        `/tenants/${currentTenant?.id}/email-templates`,
        data,
      );
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['email-templates', currentTenant?.id] });
      void navigate('/email-templates');
    },
  });

  const onSubmit = (data: CreateEmailTemplateDto) => {
    createMutation.mutate(data);
  };

  return (
    <div className="pb-12 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create email template</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
          Design a reusable email layout and content to use across your workflows.
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
            Template name
          </label>
          <input
            type="text"
            {...register('name')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Welcome Email Series #1"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
            Subject line
          </label>
          <input
            type="text"
            {...register('subject')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Welcome to our platform!"
          />
          {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
            HTML Content
          </label>
          <textarea
            {...register('html')}
            className="w-full font-mono text-sm px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            rows={8}
          />
          {errors.html && <p className="mt-1 text-sm text-red-600">{errors.html.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
            Plain text fallback (optional)
          </label>
          <textarea
            {...register('text')}
            className="w-full font-mono text-sm px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            rows={4}
          />
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting || createMutation.isPending ? 'Creating...' : 'Create template'}
          </button>
          <button
            type="button"
            onClick={() => void navigate('/email-templates')}
            className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

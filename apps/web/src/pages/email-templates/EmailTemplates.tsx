import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  type EmailTemplateResponse,
  CreateEmailTemplateSchema,
  type CreateEmailTemplateDto,
} from '@email-automation-engine/shared';
import { useTenant } from '../../contexts/TenantContext';
import api from '../../lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Dialog from '@radix-ui/react-dialog';

export default function EmailTemplates() {
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['email-templates', currentTenant?.id],
    queryFn: async () => {
      const res = await api.get<EmailTemplateResponse[]>(
        `/tenants/${currentTenant?.id}/email-templates`,
      );
      return res.data;
    },
    enabled: !!currentTenant,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tenants/${currentTenant?.id}/email-templates/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['email-templates', currentTenant?.id] });
    },
  });

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email templates</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Manage reusable email layouts and content.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-indigo-700 transition-colors"
        >
          Create template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-gray-500">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl border-dashed">
            No templates found. Create your first email template to use in workflows.
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col group"
            >
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3
                    className="font-semibold text-gray-900 dark:text-white truncate"
                    title={template.name}
                  >
                    {template.name}
                  </h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-zinc-400 line-clamp-2 mb-4">
                  {template.subject}
                </p>
                <div className="text-xs text-gray-400 dark:text-zinc-500">
                  Created {new Date(template.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 p-3 flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this template?')) {
                      deleteMutation.mutate(template.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <CreateTemplateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

function CreateTemplateModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
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
      reset();
      onClose();
    },
  });

  const onSubmit = (data: CreateEmailTemplateDto) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-40" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl sm:rounded-2xl duration-200">
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
            Create email template
          </Dialog.Title>

          <form
            onSubmit={(e) => void handleSubmit(onSubmit)(e)}
            className="space-y-4 mt-2 max-h-[70vh] overflow-y-auto px-1"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                Template name
              </label>
              <input
                type="text"
                {...register('name')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                placeholder="Welcome to our platform!"
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                HTML Content
              </label>
              <textarea
                {...register('html')}
                className="w-full font-mono text-sm px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
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
                className="w-full font-mono text-sm px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Create template'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

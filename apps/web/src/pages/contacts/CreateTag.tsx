import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import api from '../../lib/api';

export default function CreateTag() {
  const { currentTenant } = useTenant();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');

  const createMutation = useMutation({
    mutationFn: async (tagName: string) => {
      await api.post(`/tenants/${currentTenant?.id}/tags`, {
        name: tagName,
      });
    },

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['tags', currentTenant?.id],
      });

      navigate('/contacts/tags');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const tagName = name.trim();

    if (!tagName) return;

    createMutation.mutate(tagName);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/contacts/tags')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to tags
        </button>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Tag</h1>

        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Create a new tag to organize your contacts.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl border rounded-xl p-6 space-y-5">
        <div>
          <label
            htmlFor="tag-name"
            className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2"
          >
            Tag name
          </label>

          <input
            id="tag-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter tag name..."
            autoFocus
            className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="submit"
            disabled={!name.trim() || createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />

            {createMutation.isPending ? 'Creating...' : 'Create tag'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/contacts/tags')}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

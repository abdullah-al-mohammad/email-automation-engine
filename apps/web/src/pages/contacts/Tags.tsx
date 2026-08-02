import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type TagResponse } from '@email-automation-engine/shared';
import { useTenant } from '../../contexts/TenantContext';
import api from '../../lib/api';
import { Plus, Trash2, Tag } from 'lucide-react';
import pluralize from 'pluralize';
import EmptyState from '../../components/shared/EmptyState';

export default function Tags() {
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();
  const [newTagName, setNewTagName] = useState('');
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags', currentTenant?.id],
    queryFn: async () => {
      const res = await api.get<TagResponse[]>(`/tenants/${currentTenant?.id}/tags`);
      return res.data;
    },
    enabled: !!currentTenant,
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      await api.post(`/tenants/${currentTenant?.id}/tags`, { name });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tags', currentTenant?.id] });
      setNewTagName('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (tagId: string) => {
      await api.delete(`/tenants/${currentTenant?.id}/tags/${tagId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tags', currentTenant?.id] });
      void queryClient.invalidateQueries({ queryKey: ['contacts', currentTenant?.id] });
      setTagToDelete(null);
    },
  });

  const handleCreate = () => {
    const name = newTagName.trim();
    if (!name) return;
    createMutation.mutate(name);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tags</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          {pluralize('tag', tags.length, true)} total
        </p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="New tag name..."
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          onClick={handleCreate}
          disabled={!newTagName.trim() || createMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create tag
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-gray-500 text-sm">Loading tags...</div>
        ) : tags.length === 0 ? (
          <EmptyState
            icon={<Tag className="w-6 h-6" />}
            title="No tags yet"
            description="Create a tag above to start organizing your contacts."
          />
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-zinc-800">
            {tags.map((tag) => (
              <li
                key={tag.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50"
              >
                <span className="inline-flex items-center gap-2 text-sm text-gray-900 dark:text-zinc-300">
                  <Tag className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  {tag.name}
                </span>
                {tagToDelete === tag.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600 dark:text-red-400">Delete?</span>
                    <button
                      onClick={() => deleteMutation.mutate(tag.id)}
                      className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setTagToDelete(null)}
                      className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-700 rounded hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setTagToDelete(tag.id)}
                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

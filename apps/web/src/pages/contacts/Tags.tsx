import { type TagResponse } from '@email-automation-engine/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Tag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../../components/shared/EmptyState';
import { useTenant } from '../../contexts/TenantContext';
import api from '../../lib/api';

export default function Tags() {
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [tagToDelete, setTagToDelete] = useState<string | null>(null);

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags', currentTenant?.id],
    queryFn: async () => {
      const res = await api.get<TagResponse[]>(`/tenants/${currentTenant?.id}/tags`);

      return res.data;
    },
    enabled: !!currentTenant,
  });

  const deleteMutation = useMutation({
    mutationFn: async (tagId: string) => {
      await api.delete(`/tenants/${currentTenant?.id}/tags/${tagId}`);
    },

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['tags', currentTenant?.id],
      });

      void queryClient.invalidateQueries({
        queryKey: ['contacts', currentTenant?.id],
      });

      setTagToDelete(null);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tags</h1>
          <button
            onClick={() => void navigate('/contacts/tags/create')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-600 dark:border-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add new
          </button>
        </div>
      </div>

      <div>
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
                      disabled={deleteMutation.isPending}
                      className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
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

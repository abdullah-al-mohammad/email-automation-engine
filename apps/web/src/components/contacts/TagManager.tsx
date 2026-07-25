import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type TagResponse } from '@email-automation-engine/shared';
import { useTenant } from '../../contexts/TenantContext';
import api from '../../lib/api';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Plus, Trash2 } from 'lucide-react';

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TagManager({ isOpen, onClose }: TagManagerProps) {
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
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-40" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl sm:rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
              Manage tags
            </Dialog.Title>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Create tag */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="New tag name..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={handleCreate}
              disabled={!newTagName.trim() || createMutation.isPending}
              className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Tag list */}
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="py-8 text-center text-gray-500 text-sm">Loading tags...</div>
            ) : tags.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                No tags yet. Create one above.
              </div>
            ) : (
              tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 group"
                >
                  <span className="text-sm text-gray-900 dark:text-zinc-300">{tag.name}</span>
                  {tagToDelete === tag.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-red-600 dark:text-red-400 mr-1">Delete?</span>
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
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-zinc-800 mt-4">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Done
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

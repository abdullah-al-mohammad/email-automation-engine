import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ContactResponse, type TagResponse } from '@email-automation-engine/shared';
import { useTenant } from '../../contexts/TenantContext';
import api from '../../lib/api';
import { ArrowLeft, Trash2, Mail, Calendar, Tag, X, Pencil, Check } from 'lucide-react';

export default function ContactDetailPage() {
  const { contactId } = useParams<{ contactId: string }>();
  const navigate = useNavigate();
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingField, setEditingField] = useState<'email' | 'subscribed' | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editSubscribed, setEditSubscribed] = useState(true);

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact', currentTenant?.id, contactId],
    queryFn: async () => {
      const res = await api.get<ContactResponse>(
        `/tenants/${currentTenant?.id}/contacts/${contactId}`,
      );
      return res.data;
    },
    enabled: !!currentTenant && !!contactId,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['tags', currentTenant?.id],
    queryFn: async () => {
      const res = await api.get<TagResponse[]>(`/tenants/${currentTenant?.id}/tags`);
      return res.data;
    },
    enabled: !!currentTenant,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { email?: string; subscribed?: boolean }) => {
      const res = await api.patch<ContactResponse>(
        `/tenants/${currentTenant?.id}/contacts/${contactId}`,
        data,
      );
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contact', currentTenant?.id, contactId] });
      void queryClient.invalidateQueries({ queryKey: ['contacts', currentTenant?.id] });
      setEditingField(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/tenants/${currentTenant?.id}/contacts/${contactId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contacts', currentTenant?.id] });
      void navigate('/contacts');
    },
  });

  const assignTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      await api.post(`/tenants/${currentTenant?.id}/contacts/${contactId}/tags/${tagId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contact', currentTenant?.id, contactId] });
      void queryClient.invalidateQueries({ queryKey: ['contacts', currentTenant?.id] });
    },
  });

  const removeTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      await api.delete(`/tenants/${currentTenant?.id}/contacts/${contactId}/tags/${tagId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contact', currentTenant?.id, contactId] });
      void queryClient.invalidateQueries({ queryKey: ['contacts', currentTenant?.id] });
    },
  });

  const startEditEmail = () => {
    setEditEmail(contact?.email ?? '');
    setEditingField('email');
  };

  const startEditSubscribed = () => {
    setEditSubscribed(contact?.subscribed ?? true);
    setEditingField('subscribed');
  };

  const saveEdit = () => {
    if (editingField === 'email') {
      updateMutation.mutate({ email: editEmail });
    } else if (editingField === 'subscribed') {
      updateMutation.mutate({ subscribed: editSubscribed });
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
  };

  const assignedTagIds = contact?.tags?.map((t) => t.id) ?? [];
  const availableTags = tags.filter((t) => !assignedTagIds.includes(t.id));

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => void navigate('/contacts')}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contact details</h1>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-500 dark:text-zinc-400">Loading contact...</div>
      ) : !contact ? (
        <div className="py-12 text-center text-gray-500 dark:text-zinc-400">Contact not found</div>
      ) : (
        <div className="space-y-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          {/* Email */}
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">Email</p>
              {editingField === 'email' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={saveEdit}
                    disabled={updateMutation.isPending}
                    className="p-1.5 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {contact.email}
                  </p>
                  <button
                    onClick={startEditEmail}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 flex items-center justify-center mt-0.5">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  contact.subscribed ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">Status</p>
              {editingField === 'subscribed' ? (
                <div className="flex items-center gap-2">
                  <select
                    value={String(editSubscribed)}
                    onChange={(e) => setEditSubscribed(e.target.value === 'true')}
                    className="px-3 py-1.5 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="true">Subscribed</option>
                    <option value="false">Unsubscribed</option>
                  </select>
                  <button
                    onClick={saveEdit}
                    disabled={updateMutation.isPending}
                    className="p-1.5 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {contact.subscribed ? 'Subscribed' : 'Unsubscribed'}
                  </p>
                  <button
                    onClick={startEditSubscribed}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">Created</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {new Date(contact.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">Updated</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {new Date(contact.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex items-start gap-3">
            <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {contact.tags && contact.tags.length > 0 ? (
                  contact.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400"
                    >
                      {tag.name}
                      <button
                        onClick={() => removeTagMutation.mutate(tag.id)}
                        className="ml-0.5 hover:text-indigo-600 dark:hover:text-indigo-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 dark:text-zinc-500">No tags</span>
                )}
              </div>
              {availableTags.length > 0 && (
                <div className="mt-2">
                  <select
                    className="text-xs border border-gray-200 dark:border-zinc-700 rounded-lg px-2 py-1 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        assignTagMutation.mutate(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">Add tag...</option>
                    {availableTags.map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          {contact.metadata && Object.keys(contact.metadata).length > 0 && (
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                <div className="w-4 h-4 border border-gray-400 rounded text-[10px] flex items-center justify-center text-gray-400 font-mono">
                  {'{ }'}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-2">Metadata</p>
                <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-3 font-mono text-xs space-y-1">
                  {Object.entries(contact.metadata).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <span className="text-gray-500 dark:text-zinc-400">{key}:</span>
                      <span className="text-gray-900 dark:text-zinc-300 break-all">
                        {typeof value === 'string' ? value : JSON.stringify(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Delete */}
          <div className="pt-4 border-t border-gray-200 dark:border-zinc-800">
            {showDeleteConfirm ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-red-600 dark:text-red-400">Delete this contact?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void deleteMutation.mutate()}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete contact
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import {
  type RoleResponse,
  type TenantInvitationResponse,
  type TenantMemberResponse,
  type TenantResponse,
} from '@email-automation-engine/shared';
import * as Tabs from '@radix-ui/react-tabs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import Confirm from '../../components/modals/Confirm';
import InviteMember from '../../components/modals/InviteMember';
import Invitations from '../../components/settings/Invitations';
import Members from '../../components/settings/Members';
import { useTenant } from '../../contexts/TenantContext';
import api from '../../lib/api';

export default function Settings() {
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [tenantName, setTenantName] = useState('');

  // Sync tenant name to state when it changes
  if (currentTenant && tenantName === '' && !isEditingName) {
    setTenantName(currentTenant.name);
  }

  const updateTenantMutation = useMutation({
    mutationFn: async (newName: string) => {
      const res = await api.patch<TenantResponse>(`/tenants/${currentTenant?.id}`, {
        name: newName,
      });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setIsEditingName(false);
    },
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const deleteTenantMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/tenants/${currentTenant?.id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tenants'] });
      window.location.href = '/';
    },
    onError: (err: unknown) => {
      setIsDeleteModalOpen(false);
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to delete workspace');
    },
  });

  const { data: members = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ['tenant-members', currentTenant?.id],
    queryFn: async () => {
      const res = await api.get<TenantMemberResponse[]>(`/tenants/${currentTenant?.id}/members`);
      return res.data;
    },
    enabled: !!currentTenant,
  });

  const { data: invitations = [], isLoading: isLoadingInvitations } = useQuery({
    queryKey: ['tenant-invitations', currentTenant?.id],
    queryFn: async () => {
      const res = await api.get<TenantInvitationResponse[]>(
        `/tenants/${currentTenant?.id}/invitations`,
      );
      return res.data;
    },
    enabled: !!currentTenant,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['tenant-roles', currentTenant?.id],
    queryFn: async () => {
      const res = await api.get<RoleResponse[]>(`/tenants/${currentTenant?.id}/roles`);
      return res.data;
    },
    enabled: !!currentTenant,
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await api.delete(`/tenants/${currentTenant?.id}/members/${memberId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tenant-members', currentTenant?.id] });
    },
  });

  const deleteInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      await api.delete(`/tenants/${currentTenant?.id}/invitations/${invitationId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tenant-invitations', currentTenant?.id] });
    },
  });

  const getRoleName = (roleId: string) => {
    return roles.find((r) => r.id === roleId)?.name || roleId;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                className="text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b border-indigo-500 focus:outline-none focus:border-indigo-600"
                autoFocus
              />
              <button
                onClick={() => updateTenantMutation.mutate(tenantName)}
                disabled={updateTenantMutation.isPending || !tenantName.trim()}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditingName(false);
                  setTenantName(currentTenant?.name || '');
                }}
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentTenant?.name}
              </h1>
              <button
                onClick={() => setIsEditingName(true)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
            </div>
          )}
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Manage workspace preferences, members, and roles.
          </p>
        </div>
      </div>

      <Tabs.Root defaultValue="members" className="flex flex-col">
        <Tabs.List className="flex border-b border-gray-200 dark:border-zinc-800">
          <Tabs.Trigger
            value="members"
            className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-zinc-400 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 outline-none"
          >
            Members
          </Tabs.Trigger>
          <Tabs.Trigger
            value="invitations"
            className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-zinc-400 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 outline-none"
          >
            Pending invitations
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="members" className="pt-6 outline-none">
          <Members
            members={members}
            isLoadingMembers={isLoadingMembers}
            onInviteClick={() => setIsInviteModalOpen(true)}
            getRoleName={getRoleName}
            onRemoveMember={(id) => deleteMemberMutation.mutate(id)}
            isRemoving={deleteMemberMutation.isPending}
          />
        </Tabs.Content>

        <Tabs.Content value="invitations" className="pt-6 outline-none">
          <Invitations
            invitations={invitations}
            isLoadingInvitations={isLoadingInvitations}
            onInviteClick={() => setIsInviteModalOpen(true)}
            getRoleName={getRoleName}
            onRevokeInvitation={(id) => deleteInvitationMutation.mutate(id)}
            isRevoking={deleteInvitationMutation.isPending}
          />
        </Tabs.Content>
      </Tabs.Root>

      {isInviteModalOpen && (
        <InviteMember
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          roles={roles}
        />
      )}

      {/* Danger Zone */}
      <div className="mt-12 pt-8 border-t border-red-200 dark:border-red-900/30">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-500 mb-2">Danger Zone</h2>
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-red-900 dark:text-red-400">Delete workspace</h3>
            <p className="text-sm text-red-700 dark:text-red-500 mt-1">
              Once you delete a workspace, there is no going back. Please be certain.
            </p>
          </div>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Delete workspace
          </button>
        </div>
      </div>

      <Confirm
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => deleteTenantMutation.mutate()}
        title="Delete workspace"
        description="Are you absolutely sure? This action cannot be undone. This will permanently delete the workspace, all workflows, and remove all member associations."
        confirmText="Yes, delete workspace"
        isConfirming={deleteTenantMutation.isPending}
      />
    </div>
  );
}

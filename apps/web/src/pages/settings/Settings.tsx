import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Tabs from '@radix-ui/react-tabs';
import { useTenant } from '../../contexts/TenantContext';
import api from '../../lib/api';
import { type TenantMemberResponse, type TenantInvitationResponse, type RoleResponse, type TenantResponse } from '@email-automation-engine/shared';
import InviteMember from '../../components/modals/InviteMember';

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
      const res = await api.patch<TenantResponse>(`/tenants/${currentTenant?.id}`, { name: newName });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setIsEditingName(false);
    }
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
      const res = await api.get<TenantInvitationResponse[]>(`/tenants/${currentTenant?.id}/invitations`);
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
    }
  });

  const deleteInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      await api.delete(`/tenants/${currentTenant?.id}/invitations/${invitationId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tenant-invitations', currentTenant?.id] });
    }
  });

  const getRoleName = (roleId: string) => {
    return roles.find(r => r.id === roleId)?.name || roleId;
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8">
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{currentTenant?.name}</h1>
              <button 
                onClick={() => setIsEditingName(true)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Manage workspace preferences, members, and roles.</p>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active members</h2>
            <button 
              onClick={() => setIsInviteModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Invite member
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-zinc-400">User ID</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-zinc-400">Role</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-zinc-400">Status</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-zinc-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                {isLoadingMembers ? (
                  <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
                ) : members.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No members found.</td></tr>
                ) : members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4 text-gray-900 dark:text-zinc-300 font-mono text-xs">{member.userId}</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-zinc-300">{getRoleName(member.roleId)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        member.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => deleteMemberMutation.mutate(member.id)}
                        disabled={deleteMemberMutation.isPending}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tabs.Content>

        <Tabs.Content value="invitations" className="pt-6 outline-none">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pending invitations</h2>
            <button 
              onClick={() => setIsInviteModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Invite member
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-zinc-400">Email</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-zinc-400">Role</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-zinc-400">Sent on</th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-zinc-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                {isLoadingInvitations ? (
                  <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
                ) : invitations.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No pending invitations.</td></tr>
                ) : invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4 text-gray-900 dark:text-zinc-300">{inv.email}</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-zinc-300">{getRoleName(inv.roleId)}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-zinc-400">{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => deleteInvitationMutation.mutate(inv.id)}
                        disabled={deleteInvitationMutation.isPending}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium disabled:opacity-50"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tabs.Content>
      </Tabs.Root>

      {isInviteModalOpen && (
        <InviteMember 
          isOpen={isInviteModalOpen} 
          onClose={() => setIsInviteModalOpen(false)} 
          roles={roles}
        />
      )}
    </div>
  );
}

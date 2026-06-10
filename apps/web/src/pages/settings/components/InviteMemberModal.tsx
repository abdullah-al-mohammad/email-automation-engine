import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTenantInvitationSchema, type CreateTenantInvitationDto, type RoleResponse } from '@email-automation-engine/shared';
import * as Dialog from '@radix-ui/react-dialog';
import { useTenant } from '../../../contexts/TenantContext';
import api from '../../../lib/api';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: RoleResponse[];
}

export default function InviteMemberModal({ isOpen, onClose, roles }: InviteMemberModalProps) {
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateTenantInvitationDto>({
    resolver: zodResolver(createTenantInvitationSchema),
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: CreateTenantInvitationDto) => {
      const res = await api.post(`/tenants/${currentTenant?.id}/invitations`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-invitations', currentTenant?.id] });
      reset();
      onClose();
    }
  });

  const onSubmit = (data: CreateTenantInvitationDto) => {
    inviteMutation.mutate(data);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-40" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl sm:rounded-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
            Invite Team Member
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-500 dark:text-zinc-400">
            Send an invitation email to add a new member to {currentTenant?.name}.
          </Dialog.Description>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Email Address</label>
              <input 
                type="email" 
                {...register('email')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                placeholder="colleague@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Role</label>
              <select 
                {...register('roleId')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
              >
                <option value="">Select a role...</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
              {errors.roleId && <p className="mt-1 text-sm text-red-600">{errors.roleId.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Personal Message (Optional)</label>
              <textarea 
                {...register('message')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                placeholder="Join us on the Email Engine!"
                rows={3}
              />
            </div>

            {inviteMutation.isError && (
              <p className="text-sm text-red-600">{(inviteMutation.error as any)?.response?.data?.message || 'Failed to send invitation'}</p>
            )}

            <div className="flex justify-end gap-3 pt-4">
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
                {isSubmitting ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

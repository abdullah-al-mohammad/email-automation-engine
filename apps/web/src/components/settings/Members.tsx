import { type TenantMemberResponse } from '@email-automation-engine/shared';

interface MembersProps {
  members: TenantMemberResponse[];
  isLoadingMembers: boolean;
  onInviteClick: () => void;
  getRoleName: (roleId: string) => string;
  onRemoveMember: (id: string) => void;
  isRemoving: boolean;
}

export default function Members({
  members,
  isLoadingMembers,
  onInviteClick,
  getRoleName,
  onRemoveMember,
  isRemoving,
}: MembersProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active members</h2>
        <button
          onClick={onInviteClick}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-indigo-700 transition-colors"
        >
          Invite member
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-500 dark:text-zinc-400">Member</th>
              <th className="px-6 py-3 font-medium text-gray-500 dark:text-zinc-400">Role</th>
              <th className="px-6 py-3 font-medium text-gray-500 dark:text-zinc-400">Status</th>
              <th className="px-6 py-3 font-medium text-gray-500 dark:text-zinc-400 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
            {isLoadingMembers ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No members found.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                  <td className="px-6 py-4">
                    {member.user ? (
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white capitalize">
                          {(member.user?.email?.split('@')[0] || '').replace(/[^a-zA-Z0-9]/g, ' ')}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-zinc-400">
                          {member.user?.email}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-900 dark:text-zinc-300 font-mono text-xs">
                        {member.userId}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-900 dark:text-zinc-300">
                    {getRoleName(member.roleId)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        member.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onRemoveMember(member.id)}
                      disabled={isRemoving}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

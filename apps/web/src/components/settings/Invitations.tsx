import { type TenantInvitationResponse } from '@email-automation-engine/shared';

interface InvitationsProps {
  invitations: TenantInvitationResponse[];
  isLoadingInvitations: boolean;
  onInviteClick: () => void;
  getRoleName: (roleId: string) => string;
  onRevokeInvitation: (id: string) => void;
  isRevoking: boolean;
}

export default function Invitations({
  invitations,
  isLoadingInvitations,
  onInviteClick,
  getRoleName,
  onRevokeInvitation,
  isRevoking,
}: InvitationsProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pending invitations</h2>
        <button
          onClick={onInviteClick}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-indigo-700 transition-colors"
        >
          Invite member
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-500 dark:text-zinc-400">Email</th>
              <th className="px-6 py-3 font-medium text-gray-500 dark:text-zinc-400">Role</th>
              <th className="px-6 py-3 font-medium text-gray-500 dark:text-zinc-400">Sent on</th>
              <th className="px-6 py-3 font-medium text-gray-500 dark:text-zinc-400 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
            {isLoadingInvitations ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : invitations.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No pending invitations.
                </td>
              </tr>
            ) : (
              invitations.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                  <td className="px-6 py-4 text-gray-900 dark:text-zinc-300">{inv.email}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-zinc-300">
                    {getRoleName(inv.roleId)}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-zinc-400">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onRevokeInvitation(inv.id)}
                      disabled={isRevoking}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium disabled:opacity-50"
                    >
                      Revoke
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

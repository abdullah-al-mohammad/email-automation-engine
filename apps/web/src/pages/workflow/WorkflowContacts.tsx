import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  type ContactWorkflowResponse,
  type ContactWorkflowStepResponse,
} from '@email-automation-engine/shared';
import { useTenant } from '../../contexts/TenantContext';
import api from '../../lib/api';
import * as Dialog from '@radix-ui/react-dialog';

export default function WorkflowContacts() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const { currentTenant } = useTenant();
  const [selectedContactWorkflowId, setSelectedContactWorkflowId] = useState<string | null>(null);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['workflow-contacts', currentTenant?.id, workflowId],
    queryFn: async () => {
      const res = await api.get<ContactWorkflowResponse[]>(
        `/tenants/${currentTenant?.id}/workflows/${workflowId}/contact-workflows`,
      );
      return res.data;
    },
    enabled: !!currentTenant && !!workflowId,
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={`/workflows/${workflowId}`}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              &larr; Back to Builder
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Execution summary</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Monitor contacts currently processing through this workflow.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-500 dark:text-zinc-400">Contact ID</th>
              <th className="px-6 py-3 font-medium text-gray-500 dark:text-zinc-400">
                Trigger event
              </th>
              <th className="px-6 py-3 font-medium text-gray-500 dark:text-zinc-400">Status</th>
              <th className="px-6 py-3 font-medium text-gray-500 dark:text-zinc-400">Started at</th>
              <th className="px-6 py-3 font-medium text-gray-500 dark:text-zinc-400 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No contacts have entered this workflow yet.
                </td>
              </tr>
            ) : (
              contacts.map((cw) => (
                <tr key={cw.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                  <td className="px-6 py-4 text-gray-900 dark:text-zinc-300 font-mono text-xs">
                    {cw.contactId}
                  </td>
                  <td className="px-6 py-4 text-gray-900 dark:text-zinc-300">{cw.triggerEvent}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        cw.status === 'finished'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : cw.status === 'error'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}
                    >
                      {cw.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-zinc-400">
                    {cw.startedAt ? new Date(cw.startedAt).toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedContactWorkflowId(cw.id)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                    >
                      View timeline
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedContactWorkflowId && (
        <TimelineModal
          isOpen={true}
          onClose={() => setSelectedContactWorkflowId(null)}
          contactWorkflowId={selectedContactWorkflowId}
          workflowId={workflowId!}
        />
      )}
    </div>
  );
}

function TimelineModal({
  isOpen,
  onClose,
  contactWorkflowId,
  workflowId,
}: {
  isOpen: boolean;
  onClose: () => void;
  contactWorkflowId: string;
  workflowId: string;
}) {
  const { currentTenant } = useTenant();

  const { data: timeline = [], isLoading } = useQuery({
    queryKey: ['workflow-timeline', currentTenant?.id, workflowId, contactWorkflowId],
    queryFn: async () => {
      const res = await api.get<ContactWorkflowStepResponse[]>(
        `/tenants/${currentTenant?.id}/workflows/${workflowId}/contact-workflows/${contactWorkflowId}`,
      );
      return res.data;
    },
    enabled: !!currentTenant,
  });

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-40" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl sm:rounded-2xl flex flex-col max-h-[85vh]">
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Execution timeline
          </Dialog.Title>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {isLoading ? (
              <div className="text-center text-gray-500 py-8">Loading timeline...</div>
            ) : timeline.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No steps executed yet.</div>
            ) : (
              <div className="relative border-l border-gray-200 dark:border-zinc-700 ml-3 space-y-6">
                {timeline.map((step) => (
                  <div key={step.id} className="relative pl-6">
                    <span
                      className={`absolute -left-2.5 top-1 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white dark:ring-zinc-900 ${
                        step.status === 'finished'
                          ? 'bg-green-500'
                          : step.status === 'error'
                            ? 'bg-red-500'
                            : step.status === 'scheduled'
                              ? 'bg-yellow-500'
                              : 'bg-gray-300 dark:bg-zinc-600'
                      }`}
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        Step ID:{' '}
                        <span className="font-mono text-xs text-gray-500">
                          {step.workflowStepId}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-zinc-400 capitalize mb-1">
                        Status:{' '}
                        <span className="font-semibold text-gray-700 dark:text-zinc-300">
                          {step.status}
                        </span>
                      </div>
                      {step.scheduledAt && (
                        <div className="text-xs text-gray-500 dark:text-zinc-400">
                          Scheduled: {new Date(step.scheduledAt).toLocaleString()}
                        </div>
                      )}
                      {step.finishedAt && (
                        <div className="text-xs text-gray-500 dark:text-zinc-400">
                          Finished: {new Date(step.finishedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-zinc-800 text-right mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Close
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

import { Handle, Position } from '@xyflow/react';
import {
  type WorkflowTriggerResponse,
  SUPPORTED_TRIGGER_EVENTS,
} from '@email-automation-engine/shared';

export function TriggerNode({
  data,
}: {
  data: {
    trigger: WorkflowTriggerResponse;
  };
}) {
  const { trigger } = data;

  const label = SUPPORTED_TRIGGER_EVENTS.find((e) => e === trigger.event) || trigger.event;

  return (
    <div className="w-[280px] bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm px-4 py-3 group hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors relative">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-zinc-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Trigger</h4>
          <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
            {label
              .replaceAll('_', ' ')
              .replaceAll('.', ' ')
              .replace(/^./, (c) => c.toUpperCase())}
          </p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </div>
  );
}

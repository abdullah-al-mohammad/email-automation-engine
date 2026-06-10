import { Handle, Position } from '@xyflow/react';
import {
  type WorkflowStepResponse,
  SUPPORTED_STEP_ACTIONS,
  STEP_ACTIONS,
} from '@email-automation-engine/shared';

const ICONS: Record<string, React.ReactNode> = {
  [STEP_ACTIONS.SEND_EMAIL]: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  ),
  [STEP_ACTIONS.DELAY]: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  [STEP_ACTIONS.CONDITIONAL_SPLIT]: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
      />
    </svg>
  ),
  [STEP_ACTIONS.ATTACH_TAG]: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
      />
    </svg>
  ),
  // Default icon
  default: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
};

export function Step({ data }: { data: { step: WorkflowStepResponse } }) {
  const { step } = data;

  const isSplit = step.action === STEP_ACTIONS.CONDITIONAL_SPLIT;
  const label = SUPPORTED_STEP_ACTIONS.find((a) => a === step.action) || step.action;
  const icon = ICONS[step.action] || ICONS.default;

  return (
    <div className="w-[280px] bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm px-4 py-3 group hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-400 border-2 border-white dark:border-zinc-900"
      />

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-zinc-400">
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white capitalize">
            {label.replace('_', ' ')}
          </h4>
          <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
            {step.action === STEP_ACTIONS.DELAY
              ? `${(step.config as { durationValue?: number; durationUnit?: string })?.durationValue} ${(step.config as { durationValue?: number; durationUnit?: string })?.durationUnit}`
              : 'Configure action'}
          </p>
        </div>
      </div>

      {isSplit ? (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            className="w-3 h-3 bg-green-500 border-2 border-white dark:border-zinc-900 translate-x-[-40px]"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            className="w-3 h-3 bg-red-500 border-2 border-white dark:border-zinc-900 translate-x-[40px]"
          />
          <div className="absolute -bottom-6 left-1/4 transform -translate-x-1/2 text-[10px] font-bold text-green-600 uppercase">
            True
          </div>
          <div className="absolute -bottom-6 right-1/4 transform translate-x-1/2 text-[10px] font-bold text-red-600 uppercase">
            False
          </div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-gray-400 border-2 border-white dark:border-zinc-900"
        />
      )}
    </div>
  );
}

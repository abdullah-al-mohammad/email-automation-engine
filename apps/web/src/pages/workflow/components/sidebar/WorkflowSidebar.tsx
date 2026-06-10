import { type WorkflowStepResponse, type WorkflowTriggerResponse } from '@email-automation-engine/shared';
import TriggerForm from '../forms/TriggerForm';
import StepForm from '../forms/StepForm';

interface WorkflowSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNode: { type: 'trigger' | 'step'; data: any } | null;
  workflowId: string;
  isActive: boolean;
}

export default function WorkflowSidebar({ isOpen, onClose, selectedNode, workflowId, isActive }: WorkflowSidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 shadow-xl flex flex-col z-10 transition-transform">
      <div className="h-14 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between px-4 shrink-0">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {selectedNode?.type === 'trigger' ? 'Configure Trigger' : 'Configure Step'}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {!selectedNode ? (
          <div className="text-sm text-gray-500">Select a node to configure</div>
        ) : selectedNode.type === 'trigger' ? (
          <TriggerForm 
            trigger={selectedNode.data as WorkflowTriggerResponse} 
            workflowId={workflowId} 
            isActive={isActive} 
            onSuccess={onClose}
          />
        ) : (
          <StepForm 
            step={selectedNode.data as WorkflowStepResponse} 
            workflowId={workflowId} 
            isActive={isActive} 
            onSuccess={onClose}
          />
        )}
      </div>
    </div>
  );
}

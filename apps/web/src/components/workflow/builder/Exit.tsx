import { Handle, Position } from '@xyflow/react';
import { LogOut } from 'lucide-react';

export function Exit() {
  return (
    <div className="w-[280px] bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm px-4 py-3 relative">
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-zinc-400">
          <LogOut className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Contact exits</h4>
          <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">End of workflow</p>
        </div>
      </div>
    </div>
  );
}

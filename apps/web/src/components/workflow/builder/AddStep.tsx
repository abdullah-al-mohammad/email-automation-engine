import { Handle, Position } from '@xyflow/react';

export function AddStep({
  data,
}: {
  data: {
    parentId: string | null;
    branch: 'linear' | true | false;
    onAddNode: (parentId: string | null, branch: 'linear' | true | false) => void;
  };
}) {
  return (
    <div className="relative w-[60px] h-[60px] flex items-center justify-center">
      <Handle type="target" position={Position.Top} className="!opacity-0" isConnectable={false} />

      <button
        onClick={(e) => {
          e.stopPropagation();
          data.onAddNode(data.parentId, data.branch);
        }}
        className="w-8 h-8 bg-white dark:bg-zinc-800 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-full flex items-center justify-center hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 hover:scale-110 transition-all z-10 shadow-sm cursor-pointer group"
        title="Add step"
      >
        <svg
          className="w-5 h-5 text-gray-400 dark:text-zinc-500 group-hover:text-indigo-500 transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!opacity-0"
        isConnectable={false}
      />
    </div>
  );
}

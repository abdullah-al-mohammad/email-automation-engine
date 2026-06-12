import { Link } from 'react-router-dom';
import { type WorkflowResponse } from '@email-automation-engine/shared';
import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit2, Trash2, Workflow as WorkflowIcon } from 'lucide-react';

function WorkflowListItem({
  workflow,
  onDelete,
}: {
  workflow: WorkflowResponse;
  onDelete: (id: string) => void;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <li
      className={`first:rounded-t-xl last:rounded-b-xl hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors flex items-center pr-4 relative ${isDropdownOpen ? 'z-20' : 'z-0'}`}
    >
      <Link to={`/workflows/${workflow.id}`} className="block p-4 sm:px-6 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                {workflow.name}
              </p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  workflow.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                {workflow.isActive ? 'Active' : 'Draft'}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-zinc-400 truncate">
              {workflow.description || 'No description provided'}
            </p>
          </div>
        </div>
      </Link>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDropdownOpen(!isDropdownOpen);
          }}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          title="Actions"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-gray-100 dark:border-zinc-700 py-1 z-20">
            <Link
              to={`/workflows/${workflow.id}`}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700/50 flex items-center transition-colors"
            >
              <WorkflowIcon className="w-4 h-4 mr-2" />
              Open builder
            </Link>
            <Link
              to={`/workflows/${workflow.id}/edit`}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700/50 flex items-center transition-colors"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit workflow
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDropdownOpen(false);
                onDelete(workflow.id);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete workflow
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

export default function Workflows({
  workflows,
  onDelete,
}: {
  workflows: WorkflowResponse[];
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm">
      <ul className="divide-y divide-gray-200 dark:divide-zinc-800">
        {workflows.map((workflow) => (
          <WorkflowListItem key={workflow.id} workflow={workflow} onDelete={onDelete} />
        ))}
      </ul>
    </div>
  );
}

import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WorkflowsHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workflows</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
          Create and manage your automated email sequences.
        </p>
      </div>
      <Link
        to="/workflows/create"
        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create workflow
      </Link>
    </div>
  );
}

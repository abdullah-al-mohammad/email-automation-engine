import { type WorkflowResponse } from '@email-automation-engine/shared';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock,
  Mail,
  PlayCircle,
  Users,
  XCircle,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { useTenant } from '../../contexts/TenantContext';
import api from '../../lib/api';

export default function ExecutionSummary() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const { currentTenant } = useTenant();

  const { data: workflow, isLoading } = useQuery({
    queryKey: ['workflows', currentTenant?.id, workflowId],
    queryFn: async () => {
      const res = await api.get<WorkflowResponse>(
        `/tenants/${currentTenant?.id}/workflows/${workflowId}`,
      );
      return res.data;
    },
    enabled: !!currentTenant && !!workflowId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!workflow) {
    return <div className="p-8 text-gray-500">Workflow not found</div>;
  }

  // Mock data for the Execution Summary
  const stats = {
    totalProcessed: 12458,
    activeContacts: 342,
    completed: 11890,
    failed: 226,
    avgCompletionTime: '2.4 hours',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/workflows"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to workflows
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{workflow.name}</h1>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                Execution summary and performance metrics
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
              workflow.isActive
                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50'
                : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
            }`}
          >
            <Activity className="w-4 h-4 mr-1.5" />
            {workflow.isActive ? 'Active' : 'Draft'}
          </span>
          <Link
            to={`/workflows/${workflow.id}`}
            className="inline-flex items-center px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
          >
            Open Builder
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Processed"
          value={stats.totalProcessed.toLocaleString()}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Currently Active"
          value={stats.activeContacts.toLocaleString()}
          icon={PlayCircle}
          color="indigo"
        />
        <StatCard
          title="Completed"
          value={stats.completed.toLocaleString()}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="Failed/Exited"
          value={stats.failed.toLocaleString()}
          icon={XCircle}
          color="red"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Activity over time
            </h2>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-xl bg-gray-50/50 dark:bg-zinc-950/50">
              <div className="text-center">
                <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium">
                  Detailed analytics coming soon
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Metrics */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Step Performance
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Email Open Rate
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">42.8%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Avg. Time to Complete
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {stats.avgCompletionTime}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: 'blue' | 'indigo' | 'green' | 'red';
}) {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorMap[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}

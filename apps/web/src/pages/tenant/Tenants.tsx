import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import {
  createTenantSchema,
  type CreateTenantDto,
  type TenantResponse,
} from '@email-automation-engine/shared';
import { isAxiosError } from 'axios';
import { Plus, ChevronRight, Building } from 'lucide-react';

import { useTenant } from '../../contexts/TenantContext';
import api from '../../lib/api';

export default function Tenants() {
  const { tenants, setCurrentTenant, refreshTenants } = useTenant();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  const handleSelectTenant = (tenant: TenantResponse) => {
    setCurrentTenant(tenant);
    void navigate('/');
  };

  const handleTenantCreated = async (newTenant: TenantResponse) => {
    await refreshTenants();
    setCurrentTenant(newTenant);
    void navigate('/');
  };

  const hasTenants = tenants.length > 0;
  const showList = hasTenants && !isCreating;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 px-4">
      <div className="max-w-xl w-full">
        <Header />

        {showList && <TenantList tenants={tenants} onSelect={handleSelectTenant} />}

        {isCreating ? (
          <CreateTenantForm
            onSuccess={handleTenantCreated}
            onCancel={() => setIsCreating(false)}
            canCancel={hasTenants}
          />
        ) : (
          <div className="text-center mt-6">
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 rounded-xl transition-colors cursor-pointer w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Create a new workspace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl mb-4">
        <Building className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Choose your workspace</h1>
      <p className="text-gray-500 dark:text-zinc-400 mt-2">
        Select an existing workspace or create a new one to continue.
      </p>
    </div>
  );
}

interface TenantListProps {
  tenants: TenantResponse[];
  onSelect: (tenant: TenantResponse) => void;
}

function TenantList({ tenants, onSelect }: TenantListProps) {
  return (
    <div className="space-y-3">
      {tenants.map((tenant) => (
        <button
          key={tenant.id}
          onClick={() => onSelect(tenant)}
          className="group w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 transition-all text-left"
        >
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {tenant.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-zinc-500 mt-0.5 font-mono">
              ID: {tenant.id.split('-')[0]}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
        </button>
      ))}
    </div>
  );
}

interface CreateTenantFormProps {
  onSuccess: (tenant: TenantResponse) => void | Promise<void>;
  onCancel: () => void;
  canCancel: boolean;
}

function CreateTenantForm({ onSuccess, onCancel, canCancel }: CreateTenantFormProps) {
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateTenantDto>({
    resolver: zodResolver(createTenantSchema),
  });

  const onSubmit = async (data: CreateTenantDto) => {
    try {
      setGlobalError(null);
      const response = await api.post<TenantResponse>('/tenants', data);
      await onSuccess(response.data);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const message = (error.response?.data as { message?: string })?.message;
        setGlobalError(message || 'Failed to create workspace. Please try again.');
      } else {
        setGlobalError('An unexpected error occurred.');
      }
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800 p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Create new workspace</h2>

      {globalError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-start">
          <span className="font-medium">{globalError}</span>
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5"
          >
            Workspace name
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            className={`w-full px-4 py-2.5 border rounded-xl bg-white dark:bg-zinc-950 text-gray-900 dark:text-white outline-none transition-shadow ${
              errors.name
                ? 'border-red-300 dark:border-red-500/50 focus:ring-2 focus:ring-red-500/20'
                : 'border-gray-300 dark:border-zinc-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
            }`}
            placeholder="e.g. Acme corporation"
          />
          {errors.name && (
            <p className="mt-2 text-sm text-red-500 font-medium">{errors.name.message}</p>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all shadow-sm"
          >
            {isSubmitting ? 'Creating...' : 'Create workspace'}
          </button>

          {canCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-gray-700 dark:text-zinc-300 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

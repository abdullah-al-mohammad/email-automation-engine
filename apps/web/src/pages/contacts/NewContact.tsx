import { type ContactResponse, type ImportContactsResult } from '@email-automation-engine/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, CheckCircle, FileText, Upload, UserPlus } from 'lucide-react';
import pluralize from 'pluralize';
import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useTenant } from '../../contexts/TenantContext';
import api from '../../lib/api';

type Tab = 'import' | 'single';

interface CsvPreview {
  headers: string[];
  rows: string[][];
}

export default function NewContact() {
  const navigate = useNavigate();
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('import');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [results, setResults] = useState<ImportContactsResult | null>(null);

  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(true);
  const [error, setError] = useState('');

  const previewMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<CsvPreview>(
        `/tenants/${currentTenant?.id}/contacts/import/preview`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return res.data;
    },
    onSuccess: (data) => {
      setPreview(data);
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('No file');
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await api.post<ImportContactsResult>(
        `/tenants/${currentTenant?.id}/contacts/import`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return res.data;
    },
    onSuccess: (data) => {
      setResults(data);
      void queryClient.invalidateQueries({ queryKey: ['contacts', currentTenant?.id] });
    },
  });

  const handleFileSelect = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }
    setSelectedFile(file);
    setPreview(null);
    setResults(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleContinue = () => {
    if (selectedFile) {
      previewMutation.mutate(selectedFile);
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<ContactResponse>(`/tenants/${currentTenant?.id}/contacts`, {
        email,
        subscribed,
      });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contacts', currentTenant?.id] });
      void navigate('/contacts');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message ?? 'Failed to create contact');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => void navigate('/contacts')}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add contacts</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800">
        <button
          onClick={() => setTab('import')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'import'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
          }`}
        >
          <Upload className="w-4 h-4" />
          Import from CSV
        </button>
        <button
          onClick={() => setTab('single')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'single'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Add single contact
        </button>
      </div>

      {/* Tab content */}
      {tab === 'import' ? (
        <div className="space-y-4">
          {!results && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => void fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl p-16 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
            >
              {selectedFile ? (
                <div className="space-y-3">
                  <FileText className="w-10 h-10 text-indigo-500 mx-auto" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedFile.name}
                  </p>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 dark:text-zinc-400">
                    Drag and drop a CSV file here, or{' '}
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">browse</span>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-2">
                    CSV should have an "email" column. Optional: "subscribed", plus any metadata
                    columns.
                  </p>
                </>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />

          {previewMutation.isError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              Failed to process CSV. Please check the file format.
            </p>
          )}

          {preview && !results && (
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                    <tr>
                      {preview.headers.map((cell, i) => (
                        <th
                          key={i}
                          className="px-4 py-3 font-medium text-gray-500 dark:text-zinc-400"
                        >
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                    {preview.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                        {row.map((cell, j) => (
                          <td key={j} className="px-4 py-3 text-gray-700 dark:text-zinc-300">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {results && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {results.created}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500">Created</p>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-700 dark:text-zinc-300">
                    {results.skipped}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">Skipped (duplicates)</p>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {pluralize('error', results.errors.length, true)}
                  </p>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {results.errors.map((err) => (
                      <div
                        key={err.row}
                        className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded px-3 py-1.5"
                      >
                        <span className="font-medium">Row {err.row}:</span> {err.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedFile && !preview && !results && (
            <div className="flex justify-start gap-2">
              <button
                onClick={handleContinue}
                disabled={previewMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {previewMutation.isPending ? 'Processing...' : 'Continue'}
              </button>
              <button
                onClick={() => setSelectedFile(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {preview && !results && (
            <div className="flex justify-start gap-2">
              <button
                onClick={() => void importMutation.mutate()}
                disabled={importMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {importMutation.isPending ? 'Importing...' : 'Import contacts'}
              </button>
              <button
                onClick={() => {
                  setPreview(null);
                  setSelectedFile(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {results && (
            <div className="flex justify-end">
              <button
                onClick={() => void navigate('/contacts')}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-4 max-w-lg"
        >
          <div>
            <label
              htmlFor="new-contact-email"
              className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1"
            >
              Email *
            </label>
            <input
              id="new-contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@example.com"
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="new-contact-status"
              className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1"
            >
              Status
            </label>
            <select
              id="new-contact-status"
              value={String(subscribed)}
              onChange={(e) => setSubscribed(e.target.value === 'true')}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="true">Subscribed</option>
              <option value="false">Unsubscribed</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-start gap-2 pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createMutation.isPending ? 'Adding...' : 'Add contact'}
            </button>
            <button
              type="button"
              onClick={() => void navigate('/contacts')}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

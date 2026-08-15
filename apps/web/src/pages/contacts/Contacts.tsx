import { type PaginatedContactResponse, type TagResponse } from '@email-automation-engine/shared';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import EmptyState from '../../components/shared/EmptyState';
import Pagination from '../../components/shared/Pagination';
import { useTenant } from '../../contexts/TenantContext';
import api from '../../lib/api';
import FilterPill from './components/FilterPill';
import PerPageSelect from './components/PerPageSelect';
import { useContactsFilters } from './hooks/useContactsFilters';

export default function Contacts() {
  const { currentTenant } = useTenant();
  const navigate = useNavigate();

  const {
    filters,
    page,
    perPage,
    search,
    searchInput,
    selectedTagIds,
    subscribedFilter,
    buildQueryParams,
    handleSearch,
    handleClearSearch,
    handleTagToggle,
    handleSubscribedToggle,
    handlePerPageSelect,
    handlePageChange,
    handleSearchInputChange,
  } = useContactsFilters(currentTenant?.id);

  const { data: contactsData, isLoading } = useQuery({
    queryKey: ['contacts', currentTenant?.id, filters],
    queryFn: async () => {
      const params = buildQueryParams();
      const res = await api.get<PaginatedContactResponse>(
        `/tenants/${currentTenant?.id}/contacts?${params}`,
      );
      return res.data;
    },
    enabled: !!currentTenant,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['tags', currentTenant?.id],
    queryFn: async () => {
      const res = await api.get<TagResponse[]>(`/tenants/${currentTenant?.id}/tags`);
      return res.data;
    },
    enabled: !!currentTenant,
  });

  const contacts = contactsData?.data ?? [];
  const totalPages = contactsData?.totalPages ?? 0;
  const total = contactsData?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contacts</h1>
          <button
            onClick={() => void navigate('/contacts/new')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-600 dark:border-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add new
          </button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email..."
              value={searchInput}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-10 py-2 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Search
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterPill
            onClick={handleSubscribedToggle}
            variant={
              subscribedFilter === true
                ? 'success'
                : subscribedFilter === false
                  ? 'danger'
                  : 'default'
            }
          >
            {subscribedFilter === true
              ? 'Subscribed'
              : subscribedFilter === false
                ? 'Unsubscribed'
                : 'All statuses'}
          </FilterPill>

          {tags.map((tag) => (
            <FilterPill
              key={tag.id}
              onClick={() => handleTagToggle(tag.id)}
              variant={selectedTagIds.includes(tag.id) ? 'active' : 'default'}
            >
              {tag.name}
            </FilterPill>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-500 dark:text-zinc-400">Email</th>
              <th className="px-6 py-3 font-medium text-gray-500 dark:text-zinc-400">Tags</th>
              <th className="px-6 py-3 font-medium text-gray-500 dark:text-zinc-400">Status</th>
              <th className="px-6 py-3 font-medium text-gray-500 dark:text-zinc-400">Created</th>
              <th className="px-6 py-3 font-medium text-gray-500 dark:text-zinc-400 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  Loading contacts...
                </td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    icon={<Users className="w-6 h-6" />}
                    title="No contacts"
                    description={
                      search || selectedTagIds.length > 0 || subscribedFilter !== undefined
                        ? 'No contacts match your filters. Try adjusting your search.'
                        : 'No contacts yet. Import a CSV file or wait for contacts to enter your workflows.'
                    }
                  />
                </td>
              </tr>
            ) : (
              contacts.map((contact) => (
                <tr
                  key={contact.id}
                  className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 cursor-pointer"
                  onClick={() => void navigate(`/contacts/${contact.id}`)}
                >
                  <td className="px-6 py-4 text-gray-900 dark:text-zinc-300 font-medium">
                    {contact.email}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {contact.tags && contact.tags.length > 0 ? (
                        contact.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400"
                          >
                            {tag.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 dark:text-zinc-500 text-xs">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        contact.subscribed
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {contact.subscribed ? 'Subscribed' : 'Unsubscribed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-zinc-400">
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void navigate(`/contacts/${contact.id}`);
                      }}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-xs"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400">
          View
          <PerPageSelect perPage={perPage} onChange={handlePerPageSelect} />
          contacts
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}

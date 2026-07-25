import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type PaginatedContactResponse, type TagResponse } from '@email-automation-engine/shared';
import { useTenant } from '../../contexts/TenantContext';
import api from '../../lib/api';
import Pagination from '../../components/shared/Pagination';
import EmptyState from '../../components/shared/EmptyState';
import TagManager from '../../components/contacts/TagManager';
import { Search, X, Users, UserPlus } from 'lucide-react';

export default function Contacts() {
  const { currentTenant } = useTenant();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [subscribedFilter, setSubscribedFilter] = useState<boolean | undefined>(undefined);
  const [showTagManager, setShowTagManager] = useState(false);

  const limit = 20;

  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (search) params.set('search', search);
    if (selectedTagIds.length > 0) params.set('tagId', selectedTagIds.join(','));
    if (subscribedFilter !== undefined) params.set('subscribed', String(subscribedFilter));
    return params.toString();
  }, [page, search, selectedTagIds, subscribedFilter]);

  const { data: contactsData, isLoading } = useQuery({
    queryKey: ['contacts', currentTenant?.id, page, search, selectedTagIds, subscribedFilter],
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

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
    setPage(1);
  };

  const handleSubscribedToggle = () => {
    setSubscribedFilter((prev) => {
      if (prev === undefined) return true;
      if (prev === true) return false;
      return undefined;
    });
    setPage(1);
  };

  const contacts = contactsData?.data ?? [];
  const totalPages = contactsData?.totalPages ?? 0;
  const total = contactsData?.total ?? 0;

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contacts</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            {total} contact{total !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void navigate('/contacts/new')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add new
          </button>
          <button
            onClick={() => setShowTagManager(true)}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Manage tags
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
              onChange={(e) => setSearchInput(e.target.value)}
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
          <button
            onClick={handleSubscribedToggle}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              subscribedFilter === true
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : subscribedFilter === false
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            {subscribedFilter === true
              ? 'Subscribed'
              : subscribedFilter === false
                ? 'Unsubscribed'
                : 'All statuses'}
          </button>

          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => handleTagToggle(tag.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                selectedTagIds.includes(tag.id)
                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Page {page} of {totalPages}
          </p>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Tag manager modal */}
      {showTagManager && <TagManager isOpen={true} onClose={() => setShowTagManager(false)} />}
    </div>
  );
}

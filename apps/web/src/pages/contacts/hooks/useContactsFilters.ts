import { useCallback } from 'react';

import { useLocalStorageState } from '../../../lib/use-local-storage-state';

const SUBSCRIBED_FILTER_CYCLE = [undefined, true, false] as const;

type SubscribedFilter = (typeof SUBSCRIBED_FILTER_CYCLE)[number];

export interface ContactsFilters {
  page: number;
  perPage: number;
  search: string;
  selectedTagIds: string[];
  subscribedFilter: SubscribedFilter;
}

export function useContactsFilters(tenantId: string | undefined) {
  const key = (name: string) => `view:contacts:${tenantId}:${name}`;

  const [page, setPage] = useLocalStorageState(key('page'), 1);
  const [perPage, setPerPage] = useLocalStorageState(key('perPage'), 25);
  const [search, setSearch] = useLocalStorageState(key('search'), '');
  const [searchInput, setSearchInput] = useLocalStorageState(key('searchInput'), '');
  const [selectedTagIds, setSelectedTagIds] = useLocalStorageState<string[]>(key('tagIds'), []);
  const [subscribedFilter, setSubscribedFilter] = useLocalStorageState<SubscribedFilter>(
    key('subscribed'),
    undefined,
  );

  const filters: ContactsFilters = { page, perPage, search, selectedTagIds, subscribedFilter };

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.set('page', String(filters.page));
    params.set('limit', String(filters.perPage));
    if (filters.search) params.set('search', filters.search);
    if (filters.selectedTagIds.length > 0) params.set('tagId', filters.selectedTagIds.join(','));
    if (filters.subscribedFilter !== undefined) {
      params.set('subscribed', String(filters.subscribedFilter));
    }
    return params.toString();
  };

  const handleSearch = useCallback(() => {
    setPage(1);
    setSearch(searchInput);
  }, [setPage, setSearch, searchInput]);

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  }, [setPage, setSearch, setSearchInput]);

  const handleTagToggle = useCallback(
    (tagId: string) => {
      setSelectedTagIds((prev) =>
        prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
      );
      setPage(1);
    },
    [setPage, setSelectedTagIds],
  );

  const handleSubscribedToggle = useCallback(() => {
    setSubscribedFilter((prev) => {
      const nextIndex =
        (SUBSCRIBED_FILTER_CYCLE.indexOf(prev) + 1) % SUBSCRIBED_FILTER_CYCLE.length;
      return SUBSCRIBED_FILTER_CYCLE[nextIndex];
    });
    setPage(1);
  }, [setPage, setSubscribedFilter]);

  const handlePerPageSelect = useCallback(
    (nextPerPage: number) => {
      setPerPage(nextPerPage);
      setPage(1);
    },
    [setPage, setPerPage],
  );

  const handlePageChange = useCallback((nextPage: number) => setPage(nextPage), [setPage]);

  const handleSearchInputChange = useCallback(
    (value: string) => setSearchInput(value),
    [setSearchInput],
  );

  return {
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
  };
}

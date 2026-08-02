import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ContactResponse, type TagResponse } from '@email-automation-engine/shared';
import Contacts from './Contacts';
import api from '../../lib/api';

const { initialContacts, tagsMock, state } = vi.hoisted(() => {
  const now = '2025-01-01T00:00:00.000Z';
  const tagsMock: TagResponse[] = [
    { id: 't1', tenantId: 'tenant-1', name: 'VIP', createdAt: now, updatedAt: now },
    { id: 't2', tenantId: 'tenant-1', name: 'Beta', createdAt: now, updatedAt: now },
  ];
  const initialContacts: ContactResponse[] = Array.from({ length: 23 }, (_, i) => ({
    id: `c${i + 1}`,
    tenantId: 'tenant-1',
    email: `user${i + 1}@example.com`,
    subscribed: i % 2 === 0,
    metadata: {},
    tags: i === 0 ? tagsMock.slice(0, 1) : i === 1 ? tagsMock.slice(1, 2) : [],
    createdAt: now,
    updatedAt: now,
  }));
  const state = { contacts: [...initialContacts], tags: tagsMock };
  return { initialContacts, tagsMock, state };
});

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../contexts/TenantContext', () => ({
  useTenant: () => ({ currentTenant: { id: 'tenant-1' } }),
}));

vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn((url: string) => {
      const u = new URL(url, 'http://localhost');
      if (u.pathname.includes('/tags')) {
        return Promise.resolve({ data: state.tags });
      }

      const page = parseInt(u.searchParams.get('page') ?? '1', 10);
      const limit = parseInt(u.searchParams.get('limit') ?? '25', 10);
      const search = u.searchParams.get('search');
      const tagId = u.searchParams.get('tagId');
      const subscribed = u.searchParams.get('subscribed');

      let rows = state.contacts;
      if (search) rows = rows.filter((c) => c.email.includes(search));
      if (tagId) {
        const ids = tagId.split(',');
        rows = rows.filter((c) => c.tags?.some((t) => ids.includes(t.id)));
      }
      if (subscribed !== null) rows = rows.filter((c) => String(c.subscribed) === subscribed);

      const total = rows.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const start = (page - 1) * limit;
      return Promise.resolve({
        data: { data: rows.slice(start, start + limit), total, page, limit, totalPages },
      });
    }),
  },
}));

const getMock = vi.mocked(api.get);

function contactsUrls(): string[] {
  return getMock.mock.calls
    .map((call) => String(call[0]))
    .filter((url) => url.includes('/contacts?'));
}

function lastContactsUrl(): string {
  const urls = contactsUrls();
  return urls[urls.length - 1] ?? '';
}

function renderPage() {
  return render(
    <QueryClientProvider client={queryClient}>
      <Contacts />
    </QueryClientProvider>,
  );
}

let queryClient: QueryClient;

describe('Contacts', () => {
  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    state.contacts = [...initialContacts];
    window.localStorage.clear();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    cleanup();
    getMock.mockClear();
  });

  it('renders the contacts table', async () => {
    renderPage();

    expect(screen.getByText('Contacts')).toBeInTheDocument();
    expect(await screen.findByText('user1@example.com')).toBeInTheDocument();
    expect(screen.getByText('user2@example.com')).toBeInTheDocument();
    expect(screen.getAllByText('Subscribed').length).toBeGreaterThan(0);
    expect(screen.getAllByText('VIP').length).toBeGreaterThan(0);
  });

  it('shows an empty state when there are no contacts', async () => {
    state.contacts = [];
    renderPage();

    expect(await screen.findByText('No contacts')).toBeInTheDocument();
  });

  it('filters contacts by search', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('user1@example.com');

    await user.type(screen.getByPlaceholderText('Search by email...'), 'user5');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(lastContactsUrl()).toContain('search=user5');
    });
    expect(screen.getByText('user5@example.com')).toBeInTheDocument();
    expect(screen.queryByText('user1@example.com')).not.toBeInTheDocument();
  });

  it('filters contacts by tag', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('user1@example.com');

    await user.click(screen.getByRole('button', { name: 'VIP' }));

    await waitFor(() => {
      expect(lastContactsUrl()).toContain('tagId=t1');
    });
    expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    expect(screen.queryByText('user2@example.com')).not.toBeInTheDocument();
  });

  it('toggles the subscribed filter', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('user1@example.com');

    await user.click(screen.getByRole('button', { name: 'All statuses' }));

    await waitFor(() => {
      expect(lastContactsUrl()).toContain('subscribed=true');
    });
    expect(screen.getByRole('button', { name: 'Subscribed' })).toBeInTheDocument();
  });

  it('changes per-page via the dropdown and paginates', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('23 contacts');

    await user.click(screen.getByDisplayValue('25'));
    await user.click(await screen.findByRole('option', { name: '5' }));

    await waitFor(() => {
      expect(lastContactsUrl()).toContain('limit=5');
    });
    expect(await screen.findByText('Page 1/5')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await waitFor(() => {
      expect(lastContactsUrl()).toContain('page=2');
    });
    expect(screen.getByText('Page 2/5')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Last page' }));
    expect(await screen.findByText('Page 5/5')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'First page' }));
    expect(await screen.findByText('Page 1/5')).toBeInTheDocument();
  });

  it('accepts a custom per-page value typed into the combobox', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('23 contacts');

    const input = screen.getByDisplayValue('25');
    await user.clear(input);
    await user.type(input, '30');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(lastContactsUrl()).toContain('limit=30');
    });
    expect(await screen.findByDisplayValue('30')).toBeInTheDocument();
    expect(screen.getByText('Page 1/1')).toBeInTheDocument();
  });

  it('persists view preferences to localStorage', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('23 contacts');

    await user.click(screen.getByDisplayValue('25'));
    await user.click(await screen.findByRole('option', { name: '10' }));

    await waitFor(() => {
      expect(window.localStorage.getItem('view:contacts:tenant-1:perPage')).toBe('10');
    });

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await waitFor(() => {
      expect(window.localStorage.getItem('view:contacts:tenant-1:page')).toBe('2');
    });
  });

  it('navigates to the new contact page', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('user1@example.com');

    await user.click(screen.getByRole('button', { name: 'Add new' }));
    expect(mockNavigate).toHaveBeenCalledWith('/contacts/new');
  });
});

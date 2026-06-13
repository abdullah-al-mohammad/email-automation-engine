import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditTrigger from './EditTrigger';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

afterEach(() => {
  cleanup();
});

vi.mock('../../../contexts/TenantContext', () => ({
  useTenant: () => ({ currentTenant: { id: 'tenant-1' } }),
}));

const mockUpdateTrigger = vi.fn();
const mockDeleteTrigger = vi.fn();

vi.mock('../../../pages/workflow/hooks/useWorkflowTriggers', () => ({
  useWorkflowTriggers: () => ({
    updateTrigger: { mutate: mockUpdateTrigger, isPending: false },
    deleteTrigger: { mutate: mockDeleteTrigger, isPending: false },
  }),
}));

describe('EditTrigger', () => {
  const defaultTrigger = {
    id: '1',
    tenantId: 'tenant-1',
    workflowId: '1',
    event: 'API_EVENT',
    createdAt: '',
    updatedAt: '',
  };

  it('renders correctly', () => {
    render(
      <TestWrapper>
        <EditTrigger
          workflowId="1"
          trigger={defaultTrigger}
          isActive={false}
          onSuccess={vi.fn()}
          canDelete={true}
        />
      </TestWrapper>,
    );
    expect(screen.getByText('Save')).toBeDefined();
    expect(screen.getByText('Delete')).toBeDefined();
  });

  it('calls updateTrigger on save', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <EditTrigger
          workflowId="1"
          trigger={defaultTrigger}
          isActive={false}
          onSuccess={vi.fn()}
          canDelete={true}
        />
      </TestWrapper>,
    );

    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateTrigger).toHaveBeenCalledWith(
        expect.objectContaining({
          triggerId: '1',
          payload: expect.objectContaining({ event: 'API_EVENT' }),
        }),
        expect.any(Object),
      );
    });
  });

  it('calls deleteTrigger on delete click', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <EditTrigger
          workflowId="1"
          trigger={defaultTrigger}
          isActive={false}
          onSuccess={vi.fn()}
          canDelete={true}
        />
      </TestWrapper>,
    );

    const deleteButton = screen.getByText('Delete');
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteTrigger).toHaveBeenCalledWith('1', expect.any(Object));
    });
  });

  it('disables buttons when isActive is true', () => {
    render(
      <TestWrapper>
        <EditTrigger
          workflowId="1"
          trigger={defaultTrigger}
          isActive={true}
          onSuccess={vi.fn()}
          canDelete={true}
        />
      </TestWrapper>,
    );
    const saveButton = screen.getByText('Save');
    const deleteButton = screen.getByText('Delete');

    expect(saveButton.hasAttribute('disabled')).toBe(true);
    expect(deleteButton.hasAttribute('disabled')).toBe(true);
  });
});

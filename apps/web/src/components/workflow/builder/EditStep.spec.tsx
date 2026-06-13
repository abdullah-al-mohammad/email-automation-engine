import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditStep from './EditStep';

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

const mockUpdateStep = vi.fn();
const mockDeleteStep = vi.fn();

vi.mock('../../../pages/workflow/hooks/useWorkflowSteps', () => ({
  useWorkflowSteps: () => ({
    updateStep: { mutate: mockUpdateStep, isPending: false },
    deleteStep: { mutate: mockDeleteStep, isPending: false },
  }),
}));

describe('EditStep', () => {
  const defaultStep = {
    id: '1',
    tenantId: 't1',
    workflowId: '1',
    action: 'DELAY',
    position: 0,
    config: { amount: 15, unit: 'minutes' },
    createdAt: '',
    updatedAt: '',
  };

  it('renders correctly', () => {
    render(
      <TestWrapper>
        <EditStep workflowId="1" step={defaultStep} isActive={false} onSuccess={vi.fn()} />
      </TestWrapper>,
    );
    expect(screen.getByText('Save')).toBeDefined();
    expect(screen.getByText('Delete')).toBeDefined();
  });

  it('calls updateStep on save', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <EditStep workflowId="1" step={defaultStep} isActive={false} onSuccess={vi.fn()} />
      </TestWrapper>,
    );

    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateStep).toHaveBeenCalledWith(
        expect.objectContaining({
          stepId: '1',
          payload: expect.objectContaining({ action: 'DELAY' }),
        }),
        expect.any(Object),
      );
    });
  });

  it('calls deleteStep on delete click', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <EditStep workflowId="1" step={defaultStep} isActive={false} onSuccess={vi.fn()} />
      </TestWrapper>,
    );

    const deleteButton = screen.getByText('Delete');
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteStep).toHaveBeenCalledWith('1', expect.any(Object));
    });
  });

  it('disables buttons when isActive is true', () => {
    render(
      <TestWrapper>
        <EditStep workflowId="1" step={defaultStep} isActive={true} onSuccess={vi.fn()} />
      </TestWrapper>,
    );
    const saveButton = screen.getByText('Save');
    const deleteButton = screen.getByText('Delete');

    expect(saveButton.hasAttribute('disabled')).toBe(true);
    expect(deleteButton.hasAttribute('disabled')).toBe(true);
  });
});

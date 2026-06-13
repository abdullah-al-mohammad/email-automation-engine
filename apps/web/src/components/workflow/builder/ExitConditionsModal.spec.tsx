import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExitConditionsModal from './ExitConditionsModal';

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

const mockSaveConditions = vi.fn();

vi.mock('../../../pages/workflow/hooks/useWorkflowExitConditions', () => ({
  useWorkflowExitConditions: () => ({
    conditions: [],
    replaceConditions: { mutate: mockSaveConditions, isPending: false },
    isLoading: false,
  }),
}));

vi.mock('../../../pages/workflow/hooks/useTags', () => ({
  useTags: () => ({ data: [] }),
}));

describe('ExitConditionsModal', () => {
  it('renders correctly when open', () => {
    render(
      <TestWrapper>
        <ExitConditionsModal isOpen={true} onClose={vi.fn()} workflowId="1" isActive={false} />
      </TestWrapper>,
    );
    expect(screen.getByText('Exit Conditions')).toBeDefined();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <TestWrapper>
        <ExitConditionsModal isOpen={true} onClose={onClose} workflowId="1" isActive={false} />
      </TestWrapper>,
    );

    await user.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls save mutations when Save is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <ExitConditionsModal isOpen={true} onClose={vi.fn()} workflowId="1" isActive={false} />
      </TestWrapper>,
    );

    await user.click(screen.getByText('Save Conditions'));

    await waitFor(() => {
      expect(mockSaveConditions).toHaveBeenCalled();
    });
  });

  it('hides save button and shows Close when isActive is true', () => {
    render(
      <TestWrapper>
        <ExitConditionsModal isOpen={true} onClose={vi.fn()} workflowId="1" isActive={true} />
      </TestWrapper>,
    );

    expect(screen.queryByText('Save Conditions')).toBeNull();
    expect(screen.getByText('Close')).toBeDefined();
  });
});

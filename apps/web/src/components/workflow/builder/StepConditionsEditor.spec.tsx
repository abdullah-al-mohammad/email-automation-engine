import type { WorkflowStepConditionResponse } from '@email-automation-engine/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import StepConditionsEditor from './StepConditionsEditor';
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

import React from 'react';

vi.mock('../../../contexts/TenantContext', () => ({
  useTenant: () => ({ currentTenant: { id: 'tenant-1' } }),
}));

const { mockTags } = vi.hoisted(() => ({
  mockTags: [{ id: 'tag-1', name: 'Test Tag' }],
}));

vi.mock('../../../pages/workflow/hooks/useTags', () => ({
  useTags: () => ({ data: mockTags }),
}));

const { mockReplaceConditions, mockConditions } = vi.hoisted(() => {
  return {
    mockReplaceConditions: vi.fn(),
    mockConditions: [] as WorkflowStepConditionResponse[],
  };
});

vi.mock('../../../pages/workflow/hooks/useWorkflowStepConditions', () => ({
  useWorkflowStepConditions: () => ({
    conditions: mockConditions,
    replaceConditions: { mutate: mockReplaceConditions, isPending: false },
    isLoading: false,
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('StepConditionsEditor', () => {
  it('renders correctly with no conditions', () => {
    render(
      <TestWrapper>
        <StepConditionsEditor workflowId="1" stepId="1" isActive={false} />
      </TestWrapper>,
    );
    expect(screen.getByText('Split Conditions')).toBeDefined();
    expect(screen.getByText(/No conditions defined/)).toBeDefined();
  });

  it('adds a new condition on click', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <StepConditionsEditor workflowId="1" stepId="1" isActive={false} />
      </TestWrapper>,
    );

    const addButton = screen.getByRole('button', { name: /add/i });
    await user.click(addButton);

    expect(screen.getByText('Select a tag...')).toBeDefined();
  });

  it('exposes save method via ref and calls mutation', () => {
    const ref = React.createRef<{ save: () => void }>();
    render(
      <TestWrapper>
        <StepConditionsEditor ref={ref} workflowId="1" stepId="1" isActive={false} />
      </TestWrapper>,
    );

    expect(ref.current?.save).toBeDefined();
    ref.current?.save();

    expect(mockReplaceConditions).toHaveBeenCalled();
  });

  it('hides add button when isActive is true', () => {
    render(
      <TestWrapper>
        <StepConditionsEditor workflowId="1" stepId="1" isActive={true} />
      </TestWrapper>,
    );

    const addButton = screen.queryByRole('button', { name: /add/i });
    expect(addButton).toBeNull();
  });
});

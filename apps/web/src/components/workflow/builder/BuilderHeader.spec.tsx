import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import BuilderHeader from './BuilderHeader';
import { BrowserRouter } from 'react-router-dom';
import { type WorkflowResponse } from '@email-automation-engine/shared';

const mockWorkflow: WorkflowResponse = {
  id: '123',
  name: 'Test Workflow',
  tenantId: 'tenant-1',
  isActive: false,
  status: 'draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('BuilderHeader', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the workflow name', () => {
    render(
      <BrowserRouter>
        <BuilderHeader
          workflow={mockWorkflow}
          onToggleActive={vi.fn()}
          isTogglingActive={false}
          onOpenExitConditions={vi.fn()}
        />
      </BrowserRouter>,
    );
    expect(screen.getByText('Test Workflow')).toBeInTheDocument();
  });

  it('displays Draft status when not active', () => {
    render(
      <BrowserRouter>
        <BuilderHeader
          workflow={mockWorkflow}
          onToggleActive={vi.fn()}
          isTogglingActive={false}
          onOpenExitConditions={vi.fn()}
        />
      </BrowserRouter>,
    );
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Activate' })).toBeInTheDocument();
  });

  it('displays Active status when active', () => {
    render(
      <BrowserRouter>
        <BuilderHeader
          workflow={{ ...mockWorkflow, isActive: true }}
          onToggleActive={vi.fn()}
          isTogglingActive={false}
          onOpenExitConditions={vi.fn()}
        />
      </BrowserRouter>,
    );
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deactivate' })).toBeInTheDocument();
  });

  it('calls onToggleActive when button is clicked', () => {
    const onToggleActive = vi.fn();
    render(
      <BrowserRouter>
        <BuilderHeader
          workflow={mockWorkflow}
          onToggleActive={onToggleActive}
          isTogglingActive={false}
          onOpenExitConditions={vi.fn()}
        />
      </BrowserRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Activate' }));
    expect(onToggleActive).toHaveBeenCalledOnce();
  });

  it('shows Loading... when isTogglingActive is true', () => {
    render(
      <BrowserRouter>
        <BuilderHeader
          workflow={mockWorkflow}
          onToggleActive={vi.fn()}
          isTogglingActive={true}
          onOpenExitConditions={vi.fn()}
        />
      </BrowserRouter>,
    );
    expect(screen.getByRole('button', { name: 'Loading...' })).toBeDisabled();
  });

  it('calls onOpenExitConditions when settings button is clicked', () => {
    const onOpenExitConditions = vi.fn();
    render(
      <BrowserRouter>
        <BuilderHeader
          workflow={mockWorkflow}
          onToggleActive={vi.fn()}
          isTogglingActive={false}
          onOpenExitConditions={onOpenExitConditions}
        />
      </BrowserRouter>,
    );
    fireEvent.click(screen.getByTitle('Workflow Settings'));
    expect(onOpenExitConditions).toHaveBeenCalledOnce();
  });
});

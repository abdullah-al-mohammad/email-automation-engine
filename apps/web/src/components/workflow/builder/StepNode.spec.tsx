import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { StepNode } from './StepNode';
import { STEP_ACTIONS } from '@email-automation-engine/shared';

vi.mock('@xyflow/react', () => ({
  Handle: () => <div data-testid="handle" />,
  Position: { Top: 'top', Bottom: 'bottom' },
}));

vi.mock('../../../pages/workflow/hooks/useEmailTemplates', () => ({
  useEmailTemplates: () => ({ data: [] }),
}));

vi.mock('../../../pages/workflow/hooks/useTags', () => ({
  useTags: () => ({ data: [] }),
}));

afterEach(() => {
  cleanup();
});

const defaultStepProps = {
  tenantId: '1',
  workflowId: '1',
  position: 0,
  createdAt: '',
  updatedAt: '',
};

describe('StepNode', () => {
  it('renders DELAY step correctly', () => {
    render(
      <StepNode
        data={{
          step: {
            ...defaultStepProps,
            id: '1',
            action: STEP_ACTIONS.DELAY,
          },
        }}
      />,
    );
    expect(screen.getByText('Delay')).toBeDefined();
  });

  it('renders EMAIL step correctly', () => {
    render(
      <StepNode
        data={{
          step: {
            ...defaultStepProps,
            id: '2',
            action: STEP_ACTIONS.SEND_EMAIL,
          },
        }}
      />,
    );
    expect(screen.getByText('Send email')).toBeDefined();
  });

  it('renders WEBHOOK step correctly', () => {
    render(
      <StepNode
        data={{
          step: {
            ...defaultStepProps,
            id: '3',
            action: STEP_ACTIONS.WEBHOOK,
          },
        }}
      />,
    );
    expect(screen.getByText('Webhook')).toBeDefined();
  });

  it('renders TAG step correctly', () => {
    render(
      <StepNode
        data={{
          step: {
            ...defaultStepProps,
            id: '4',
            action: STEP_ACTIONS.ATTACH_TAG,
          },
        }}
      />,
    );
    expect(screen.getByText('Attach tag')).toBeDefined();
  });

  it('renders CONDITIONAL_SPLIT step correctly', () => {
    render(
      <StepNode
        data={{
          step: {
            ...defaultStepProps,
            id: '5',
            action: STEP_ACTIONS.CONDITIONAL_SPLIT,
          },
        }}
      />,
    );
    expect(screen.getByText('Conditional split')).toBeDefined();
  });
});

import { STEP_ACTIONS } from '@email-automation-engine/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Sidebar from './Sidebar';

vi.mock('./EditTrigger', () => ({
  default: () => <div data-testid="edit-trigger" />,
}));

vi.mock('./EditStep', () => ({
  default: () => <div data-testid="edit-step" />,
}));

describe('Sidebar', () => {
  it('renders trigger editor when a trigger is selected', () => {
    render(
      <Sidebar
        isOpen={true}
        onClose={vi.fn()}
        triggersCount={1}
        selectedNode={{
          type: 'trigger',
          data: {
            id: '1',
            tenantId: 't1',
            workflowId: 'w1',
            event: 'API_EVENT',
            createdAt: '',
            updatedAt: '',
          },
        }}
        workflowId="1"
        isActive={false}
      />,
    );
    expect(screen.getByTestId('edit-trigger')).toBeDefined();
  });

  it('renders step editor when a step is selected', () => {
    render(
      <Sidebar
        isOpen={true}
        onClose={vi.fn()}
        triggersCount={1}
        selectedNode={{
          type: 'step',
          data: {
            id: '1',
            tenantId: 't1',
            workflowId: '1',
            action: STEP_ACTIONS.DELAY,
            position: 1,
            config: {},
            createdAt: '',
            updatedAt: '',
          },
        }}
        workflowId="1"
        isActive={false}
      />,
    );
    expect(screen.getByTestId('edit-step')).toBeDefined();
  });
});

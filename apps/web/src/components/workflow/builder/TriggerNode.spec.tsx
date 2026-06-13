import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { TriggerNode } from './TriggerNode';
import { TRIGGER_EVENTS } from '@email-automation-engine/shared';

vi.mock('@xyflow/react', () => ({
  Handle: () => <div data-testid="handle" />,
  Position: { Top: 'top', Bottom: 'bottom' },
}));

vi.mock('../../../pages/workflow/hooks/useTags', () => ({
  useTags: () => ({ data: [] }),
}));

afterEach(() => {
  cleanup();
});

describe('TriggerNode', () => {
  it('renders CUSTOM_EVENT correctly', () => {
    render(
      <TriggerNode
        data={{
          trigger: {
            id: '1',
            tenantId: '1',
            workflowId: '1',
            event: TRIGGER_EVENTS.CUSTOM_EVENT,
            createdAt: '',
            updatedAt: '',
          },
        }}
      />,
    );
    expect(screen.getByText(TRIGGER_EVENTS.CUSTOM_EVENT)).toBeDefined();
  });

  it('renders CONTACT_SUBSCRIBED correctly', () => {
    render(
      <TriggerNode
        data={{
          trigger: {
            id: '2',
            tenantId: '1',
            workflowId: '1',
            event: TRIGGER_EVENTS.CONTACT_SUBSCRIBED,
            createdAt: '',
            updatedAt: '',
          },
        }}
      />,
    );
    expect(screen.getByText(TRIGGER_EVENTS.CONTACT_SUBSCRIBED)).toBeDefined();
  });

  it('renders EMAIL_OPENED correctly', () => {
    render(
      <TriggerNode
        data={{
          trigger: {
            id: '3',
            tenantId: '1',
            workflowId: '1',
            event: TRIGGER_EVENTS.EMAIL_OPENED,
            createdAt: '',
            updatedAt: '',
          },
        }}
      />,
    );
    expect(screen.getByText(TRIGGER_EVENTS.EMAIL_OPENED)).toBeDefined();
  });

  it('renders FORM_SUBMITTED correctly', () => {
    render(
      <TriggerNode
        data={{
          trigger: {
            id: '4',
            tenantId: '1',
            workflowId: '1',
            event: TRIGGER_EVENTS.FORM_SUBMITTED,
            createdAt: '',
            updatedAt: '',
          },
        }}
      />,
    );
    expect(screen.getByText(TRIGGER_EVENTS.FORM_SUBMITTED)).toBeDefined();
  });
});

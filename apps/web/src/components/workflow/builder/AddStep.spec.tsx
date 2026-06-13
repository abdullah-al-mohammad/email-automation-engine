import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddStep } from './AddStep';

vi.mock('@xyflow/react', () => ({
  Handle: () => <div data-testid="handle" />,
  Position: { Top: 'top', Bottom: 'bottom' },
}));

afterEach(() => {
  cleanup();
});

describe('AddStep', () => {
  it('renders correctly', () => {
    render(
      <AddStep
        data={{
          parentId: '1',
          branch: 'linear',
          onAddNode: vi.fn(),
          isDragging: false,
        }}
      />,
    );
    const button = screen.getByRole('button', { name: /add step/i });
    expect(button).toBeDefined();
  });

  it('calls onAddNode on click', async () => {
    const user = userEvent.setup();
    const mockOnAddNode = vi.fn();
    render(
      <AddStep
        data={{
          parentId: '1',
          branch: 'linear',
          onAddNode: mockOnAddNode,
          isDragging: false,
        }}
      />,
    );

    const button = screen.getByRole('button', { name: /add step/i });
    await user.click(button);

    expect(mockOnAddNode).toHaveBeenCalledWith('1', 'linear');
  });
});

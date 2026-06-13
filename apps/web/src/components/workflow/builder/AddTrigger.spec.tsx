import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddTrigger } from './AddTrigger';

vi.mock('@xyflow/react', () => ({
  Handle: () => <div data-testid="handle" />,
  Position: { Top: 'top', Bottom: 'bottom' },
}));

afterEach(() => {
  cleanup();
});

describe('AddTrigger', () => {
  it('renders correctly', () => {
    render(<AddTrigger data={{ onAddTrigger: vi.fn() }} />);
    expect(screen.getByText('Add trigger')).toBeDefined();
  });

  it('calls onAddTrigger on click', async () => {
    const user = userEvent.setup();
    const mockOnAddTrigger = vi.fn();

    const { container } = render(<AddTrigger data={{ onAddTrigger: mockOnAddTrigger }} />);

    // The div with the onClick handler is the outermost one.
    // We can just click the container's first child.
    await user.click(container.firstChild as HTMLElement);

    expect(mockOnAddTrigger).toHaveBeenCalledOnce();
  });
});

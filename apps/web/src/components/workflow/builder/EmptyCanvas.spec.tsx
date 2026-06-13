import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmptyCanvas from './EmptyCanvas';

afterEach(() => {
  cleanup();
});

describe('EmptyCanvas', () => {
  it('renders when show is true', () => {
    render(<EmptyCanvas show={true} onAddTrigger={vi.fn()} isAddingTrigger={false} />);
    expect(screen.getByText('Start building')).toBeDefined();
  });

  it('returns null when show is false', () => {
    const { container } = render(
      <EmptyCanvas show={false} onAddTrigger={vi.fn()} isAddingTrigger={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('calls onAddTrigger when the "Add your first trigger" button is clicked', async () => {
    const onAddTriggerMock = vi.fn();
    render(<EmptyCanvas show={true} onAddTrigger={onAddTriggerMock} isAddingTrigger={false} />);

    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: /add your first trigger/i });
    await user.click(button);

    expect(onAddTriggerMock).toHaveBeenCalledTimes(1);
  });

  it('disables the button and shows "Adding..." when isAddingTrigger is true', () => {
    render(<EmptyCanvas show={true} onAddTrigger={vi.fn()} isAddingTrigger={true} />);

    const button = screen.getByRole('button', { name: /adding\.\.\./i }) as HTMLButtonElement;
    expect(button).toBeDefined();
    expect(button.disabled).toBe(true);
  });
});

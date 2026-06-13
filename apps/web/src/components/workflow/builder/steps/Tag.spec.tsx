import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import TagStepForm from './Tag';

import { useForm } from 'react-hook-form';
import type { StepFormData } from '@email-automation-engine/shared';

export function TestFormWrapper({
  children,
  defaultValues,
}: {
  children: (methods: ReturnType<typeof useForm<StepFormData>>) => React.ReactNode;
  defaultValues?: Partial<StepFormData>;
}) {
  const methods = useForm<StepFormData>({ defaultValues });
  return <form>{children(methods)}</form>;
}

vi.mock('../../../../pages/workflow/hooks/useTags', () => ({
  useTags: () => ({ data: [{ id: 'tag-1', name: 'Test Tag' }] }),
}));

describe('TagStepForm', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders correctly', () => {
    render(
      <TestFormWrapper defaultValues={{ config: { tagId: 'tag-1' } }}>
        {({ register, formState: { errors } }) => (
          <TagStepForm register={register} errors={errors} isActive={false} />
        )}
      </TestFormWrapper>,
    );
    expect(screen.getByText('Select tag')).toBeDefined();
    expect(screen.getByText('Test Tag')).toBeDefined();
  });

  it('disables inputs when isActive is true', () => {
    render(
      <TestFormWrapper defaultValues={{ config: { tagId: 'tag-1' } }}>
        {({ register, formState: { errors } }) => (
          <TagStepForm register={register} errors={errors} isActive={true} />
        )}
      </TestFormWrapper>,
    );
    const select = screen.getByRole('combobox');
    expect(select.hasAttribute('disabled')).toBe(true);
  });

  it('renders validation errors', () => {
    const mockErrors = { config: { tagId: { type: 'manual', message: 'Tag is required' } } } as any;
    render(
      <TestFormWrapper defaultValues={{ config: { tagId: 'tag-1' } }}>
        {({ register }) => <TagStepForm register={register} errors={mockErrors} isActive={false} />}
      </TestFormWrapper>,
    );
    expect(screen.getByText('Tag is required')).toBeDefined();
  });
});

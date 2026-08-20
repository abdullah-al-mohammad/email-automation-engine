import type { StepFormData } from '@email-automation-engine/shared';
import { cleanup, render, screen } from '@testing-library/react';
import type { FieldErrors } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import EmailStepForm from './Email';

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

vi.mock('../../../../pages/workflow/hooks/useEmailTemplates', () => ({
  useEmailTemplates: () => ({ data: [{ id: 'tmp-1', name: 'Test Template' }] }),
}));

describe('EmailStepForm', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders correctly', () => {
    render(
      <TestFormWrapper defaultValues={{ config: { templateId: 'tmp-1' } }}>
        {({ register, formState: { errors } }) => (
          <EmailStepForm register={register} errors={errors} isActive={false} />
        )}
      </TestFormWrapper>,
    );
    expect(screen.getByText('Email template')).toBeDefined();
  });

  it('disables inputs when isActive is true', () => {
    render(
      <TestFormWrapper defaultValues={{ config: { templateId: 'tmp-1' } }}>
        {({ register, formState: { errors } }) => (
          <EmailStepForm register={register} errors={errors} isActive={true} />
        )}
      </TestFormWrapper>,
    );
    const select = screen.getByRole('combobox');
    expect(select.hasAttribute('disabled')).toBe(true);
  });

  it('renders validation errors', () => {
    const mockErrors = {
      config: { templateId: { type: 'manual', message: 'Template is required' } },
    } as FieldErrors<StepFormData>;
    render(
      <TestFormWrapper defaultValues={{ config: { templateId: 'tmp-1' } }}>
        {({ register }) => (
          <EmailStepForm register={register} errors={mockErrors} isActive={false} />
        )}
      </TestFormWrapper>,
    );
    expect(screen.getByText('Template is required')).toBeDefined();
  });
});

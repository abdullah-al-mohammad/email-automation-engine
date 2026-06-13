import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import EmailStepForm from './Email';

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
    } as any;
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

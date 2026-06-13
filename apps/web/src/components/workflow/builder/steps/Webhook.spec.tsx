import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import WebhookStepForm from './Webhook';

import { useForm } from 'react-hook-form';
import type { StepFormData } from '@email-automation-engine/shared';

export function TestFormWrapper({ children, defaultValues }: { children: (methods: ReturnType<typeof useForm<StepFormData>>) => React.ReactNode; defaultValues?: Partial<StepFormData> }) {
  const methods = useForm<StepFormData>({ defaultValues });
  return <form>{children(methods)}</form>;
}


describe('WebhookStepForm', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders correctly', () => {
    render(
      <TestFormWrapper defaultValues={{ configString: '{"url":"https://example.com"}' }}>
        {({ register, formState: { errors } }) => (
          <WebhookStepForm register={register} errors={errors} isActive={false} />
        )}
      </TestFormWrapper>,
    );
    expect(screen.getByText('Configuration (JSON)')).toBeDefined();
  });

  it('disables inputs when isActive is true', () => {
    render(
      <TestFormWrapper defaultValues={{ configString: '{"url":"https://example.com"}' }}>
        {({ register, formState: { errors } }) => (
          <WebhookStepForm register={register} errors={errors} isActive={true} />
        )}
      </TestFormWrapper>,
    );
    const textarea = screen.getByRole('textbox');
    expect(textarea.hasAttribute('disabled')).toBe(true);
  });

  it('renders validation errors', () => {
    const mockErrors = { configString: { type: 'manual', message: 'Invalid JSON' } } as any;
    render(
      <TestFormWrapper defaultValues={{ configString: '{"url":"https://example.com"}' }}>
        {({ register }) => (
          <WebhookStepForm register={register} errors={mockErrors} isActive={false} />
        )}
      </TestFormWrapper>,
    );
    expect(screen.getByText('Invalid JSON')).toBeDefined();
  });
});

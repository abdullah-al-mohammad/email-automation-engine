import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import DelayStepForm from './Delay';

import { useForm } from 'react-hook-form';
import type { StepFormData } from '@email-automation-engine/shared';

export function TestFormWrapper({ children, defaultValues }: { children: (methods: ReturnType<typeof useForm<StepFormData>>) => React.ReactNode; defaultValues?: Partial<StepFormData> }) {
  const methods = useForm<StepFormData>({ defaultValues });
  return <form>{children(methods)}</form>;
}


describe('DelayStepForm', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders correctly', () => {
    render(
      <TestFormWrapper defaultValues={{ config: { amount: 1, unit: 'days' } }}>
        {({ register, watch, formState: { errors } }) => (
          <DelayStepForm register={register} watch={watch} errors={errors} isActive={false} />
        )}
      </TestFormWrapper>,
    );
    expect(screen.getByText('Wait for')).toBeDefined();
    expect(screen.getByText('Time unit')).toBeDefined();
  });

  it('disables inputs when isActive is true', () => {
    render(
      <TestFormWrapper defaultValues={{ config: { amount: 1, unit: 'days' } }}>
        {({ register, watch, formState: { errors } }) => (
          <DelayStepForm register={register} watch={watch} errors={errors} isActive={true} />
        )}
      </TestFormWrapper>,
    );
    const amountInput = screen.getByRole('spinbutton');
    const unitSelect = screen.getByRole('combobox');
    expect(amountInput.hasAttribute('disabled')).toBe(true);
    expect(unitSelect.hasAttribute('disabled')).toBe(true);
  });

  it('renders validation errors', () => {
    const mockErrors = {
      config: { amount: { type: 'manual', message: 'Amount is required' } },
    } as any;
    render(
      <TestFormWrapper defaultValues={{ config: { amount: 1, unit: 'days' } }}>
        {({ register, watch }) => (
          <DelayStepForm register={register} watch={watch} errors={mockErrors} isActive={false} />
        )}
      </TestFormWrapper>,
    );
    expect(screen.getByText('Amount is required')).toBeDefined();
  });
});

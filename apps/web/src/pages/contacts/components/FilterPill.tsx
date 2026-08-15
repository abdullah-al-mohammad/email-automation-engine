import { type ReactNode } from 'react';

export type FilterPillVariant = 'default' | 'active' | 'success' | 'danger';

const VARIANT_CLASSES: Record<FilterPillVariant, string> = {
  default:
    'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700',
  active: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

interface FilterPillProps {
  variant?: FilterPillVariant;
  onClick: () => void;
  children: ReactNode;
}

export default function FilterPill({ variant = 'default', onClick, children }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${VARIANT_CLASSES[variant]}`}
    >
      {children}
    </button>
  );
}

import { Fragment, useState } from 'react';
import type { ReactNode } from 'react';

export interface HoverDropdownItem {
  key: string;
  label: ReactNode;
  onSelect?: () => void;
  className?: string;
  hoverClassName?: string;
  separator?: boolean;
}

interface HoverDropdownProps {
  trigger: ReactNode;
  items: HoverDropdownItem[];
}

export default function HoverDropdown({ trigger, items }: HoverDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {trigger}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg p-1 z-50">
          {items.map(({ key, label, onSelect, className, hoverClassName, separator }) => (
            <Fragment key={key}>
              {separator && <div className="h-px bg-gray-200 dark:bg-zinc-700 mx-2 my-1" />}
              <button
                type="button"
                onClick={() => {
                  onSelect?.();
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-md text-sm text-gray-700 dark:text-zinc-200 ${
                  hoverClassName ?? 'hover:bg-gray-100 dark:hover:bg-zinc-800'
                } ${className ?? ''}`}
              >
                {label}
              </button>
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

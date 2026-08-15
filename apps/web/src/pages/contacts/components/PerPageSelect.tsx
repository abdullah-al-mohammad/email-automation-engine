import { Combobox } from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

const PER_PAGE_OPTIONS = [5, 10, 25, 50, 100];

function parseTypedNumber(query: string): number | null {
  const trimmed = query.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  return parseInt(trimmed, 10);
}

function perPageOptions(query: string): number[] {
  const trimmed = query.trim();
  const typedNumber = parseTypedNumber(query);
  const matchingPresets = PER_PAGE_OPTIONS.filter((n) => String(n).includes(trimmed));
  if (typedNumber !== null && !matchingPresets.includes(typedNumber)) {
    return [typedNumber, ...matchingPresets];
  }
  return matchingPresets;
}

interface PerPageSelectProps {
  perPage: number;
  onChange: (perPage: number) => void;
}

export default function PerPageSelect({ perPage, onChange }: PerPageSelectProps) {
  const [query, setQuery] = useState('');

  const options = perPageOptions(query);
  const isCustomPageSize = (n: number) => !PER_PAGE_OPTIONS.includes(n);

  const select = (n: number | null) => {
    if (n === null) return;
    onChange(n);
    setQuery('');
  };

  const commitTypedValue = () => {
    const n = parseTypedNumber(query);
    if (n !== null && n > 0) onChange(n);
    setQuery('');
  };

  return (
    <div className="relative w-20">
      <Combobox value={perPage} onChange={select} immediate>
        <div className="relative">
          <Combobox.Input
            onChange={(e) => setQuery(e.target.value)}
            onBlur={commitTypedValue}
            displayValue={(n: number) => String(n)}
            className="w-full pr-7 px-2 py-1 text-sm border border-gray-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300">
            <ChevronsUpDown className="w-4 h-4" />
          </Combobox.Button>
        </div>
        <Combobox.Options
          anchor={{ to: 'bottom start', gap: 4, padding: 8 }}
          className="z-50 overflow-auto rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg"
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-zinc-400">
              No matching options
            </div>
          ) : (
            options.map((n) => (
              <Combobox.Option
                key={n}
                value={n}
                className={({ active }) =>
                  `flex items-center justify-between px-3 py-1.5 text-sm cursor-pointer ${
                    active
                      ? 'bg-indigo-50 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-100'
                      : 'text-gray-900 dark:text-zinc-200'
                  }`
                }
              >
                {({ selected }) => (
                  <>
                    <span>{isCustomPageSize(n) ? `Use ${n}` : n}</span>
                    {selected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                  </>
                )}
              </Combobox.Option>
            ))
          )}
        </Combobox.Options>
      </Combobox>
    </div>
  );
}

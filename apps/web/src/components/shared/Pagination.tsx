import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import pluralize from 'pluralize';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  const iconButtonClass =
    'p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors';

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500 dark:text-zinc-400">
        {pluralize('contact', total, true)}
      </span>
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          aria-label="First page"
          className={iconButtonClass}
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className={iconButtonClass}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-2 text-sm text-gray-600 dark:text-zinc-300 whitespace-nowrap">
          Page {page}/{totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className={iconButtonClass}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          aria-label="Last page"
          className={iconButtonClass}
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

import { Check, Pencil, X } from 'lucide-react';
import { type ReactNode } from 'react';

interface EditableRowProps {
  label: string;
  leading: ReactNode;
  isEditing: boolean;
  displayValue: ReactNode;
  isSaving?: boolean;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  children: ReactNode;
}

export default function EditableRow({
  label,
  leading,
  isEditing,
  displayValue,
  isSaving = false,
  onStartEdit,
  onSave,
  onCancel,
  children,
}: EditableRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{leading}</div>
      <div className="flex-1">
        <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">{label}</p>
        {isEditing ? (
          <div className="flex items-center gap-2">
            {children}
            <button
              onClick={onSave}
              disabled={isSaving}
              className="p-1.5 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={onCancel}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {displayValue}
            </span>
            <button
              onClick={onStartEdit}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

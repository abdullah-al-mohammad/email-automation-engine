import { type EmailTemplateResponse } from '@email-automation-engine/shared';

interface EmailTemplateListProps {
  templates: EmailTemplateResponse[];
  onDelete: (id: string) => void;
}

export default function EmailTemplateList({ templates, onDelete }: EmailTemplateListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template) => (
        <div
          key={template.id}
          className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col group"
        >
          <div className="p-5 flex-1">
            <div className="flex items-start justify-between mb-2">
              <h3
                className="font-semibold text-gray-900 dark:text-white truncate"
                title={template.name}
              >
                {template.name}
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-zinc-400 line-clamp-2 mb-4">
              {template.subject}
            </p>
            <div className="text-xs text-gray-400 dark:text-zinc-500">
              Created {new Date(template.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div className="border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 p-3 flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onDelete(template.id)}
              className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

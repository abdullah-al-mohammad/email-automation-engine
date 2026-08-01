import { Link, useLocation } from 'react-router-dom';
import { GitBranch, Users, FileText, Settings } from 'lucide-react';

const navItems = [
  { path: '/workflows', label: 'Workflows', icon: GitBranch },
  { path: '/contacts', label: 'Contacts', icon: Users },
  { path: '/email-templates', label: 'Templates', icon: FileText },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-48 pt-8 px-3">
      <nav className="flex flex-col gap-0.5">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname.startsWith(path);
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                isActive
                  ? 'text-indigo-600 font-medium dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-900 dark:text-zinc-500 dark:hover:text-zinc-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

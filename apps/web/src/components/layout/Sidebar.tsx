import {
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  GitBranch,
  LogOut,
  Mail,
  Settings,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import HoverDropdown from '../shared/HoverDropdown';

interface NavItem {
  path: string;
  label: string;
  icon: typeof User;
  children?: { path: string; label: string }[];
}

const navItems: NavItem[] = [
  {
    path: '/contacts',
    label: 'Contacts',
    icon: User,
    children: [
      { path: '/contacts', label: 'View all' },
      { path: '/contacts/new', label: 'Add new' },
      { path: '/contacts/tags', label: 'Tags' },
    ],
  },
  { path: '/workflows', label: 'Workflows', icon: GitBranch },
  { path: '/email-templates', label: 'Templates', icon: FileText },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const { logout } = useAuth();
  const { currentTenant, tenants, setCurrentTenant } = useTenant();
  const navigate = useNavigate();
  const [openGroup, setOpenGroup] = useState<string | null>(
    () =>
      navItems.find((item) => item.children && location.pathname.startsWith(item.path))?.path ??
      null,
  );

  return (
    <aside className="fixed inset-y-0 left-0 w-[220px] pt-6 px-3 flex flex-col">
      <Link
        to="/"
        className="hover:opacity-80 transition-opacity flex items-center gap-2 text-indigo-600 dark:text-indigo-400 px-3 mb-4"
      >
        <Mail className="w-5 h-5" />
        <h1 className="font-bold text-lg text-gray-900 dark:text-white">Engine</h1>
      </Link>
      {currentTenant && (
        <div className="px-3 mb-4">
          <HoverDropdown
            trigger={
              <button
                type="button"
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent text-gray-900 dark:text-white text-sm flex items-center justify-between"
              >
                {currentTenant.name}
                <ChevronDown className="w-4 h-4" />
              </button>
            }
            items={[
              ...tenants.map((t) => ({
                key: t.id,
                label: (
                  <span className="flex items-center justify-between gap-2">
                    {t.name}
                    {t.id === currentTenant.id && (
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </span>
                ),
                onSelect: () => setCurrentTenant(t),
              })),
              {
                key: 'MANAGE_WORKSPACES',
                separator: true,
                label: <span className="text-gray-500 dark:text-zinc-400">Manage workspaces</span>,
                onSelect: () => void navigate('/'),
              },
              {
                key: 'SIGN_OUT',
                separator: true,
                hoverClassName: 'hover:bg-red-50 dark:hover:bg-red-900/30',
                label: (
                  <span className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </span>
                ),
                onSelect: () => logout(),
              },
            ]}
          />
        </div>
      )}
      <nav className="flex flex-col gap-0.5">
        {navItems.map(({ path, label, icon: Icon, children }) => {
          const hasChildren = !!children && children.length > 0;
          const isGroupActive = hasChildren && location.pathname.startsWith(path);
          const isOpen = openGroup === path;
          return (
            <div key={path}>
              <Link
                to={path}
                onClick={hasChildren ? () => setOpenGroup(isOpen ? null : path) : undefined}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  isGroupActive || location.pathname.startsWith(path)
                    ? 'text-indigo-600 font-medium dark:text-indigo-400'
                    : 'text-gray-500 hover:text-gray-900 dark:text-zinc-500 dark:hover:text-zinc-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {hasChildren && (
                  <ChevronRight
                    className={`w-4 h-4 ml-auto transition-transform ${isOpen ? 'rotate-90' : ''}`}
                  />
                )}
              </Link>
              {hasChildren && isOpen && (
                <div className="mt-0.5 flex flex-col gap-0.5">
                  {children.map((child) => {
                    const isChildActive = location.pathname === child.path;
                    return (
                      <Link
                        key={child.path}
                        to={child.path}
                        className={`flex items-center gap-2.5 pl-9 pr-3 py-1.5 rounded-md text-sm transition-colors ${
                          isChildActive
                            ? 'text-indigo-600 font-medium dark:text-indigo-400'
                            : 'text-gray-500 hover:text-gray-900 dark:text-zinc-500 dark:hover:text-zinc-300'
                        }`}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

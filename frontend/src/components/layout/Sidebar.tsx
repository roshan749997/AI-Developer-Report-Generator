import { NavLink } from 'react-router-dom';
import {
  Activity,
  Bell,
  Building2,
  ClipboardList,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Shield,
  UserCircle2,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  roles?: Array<'admin' | 'manager' | 'developer'>;
}

const links: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/activities', label: 'Git Activities', icon: Activity },
  { to: '/reports', label: 'Reports', icon: FileText },
  {
    to: '/organization',
    label: 'Organization',
    icon: Building2,
    roles: ['admin', 'manager', 'developer'],
  },
  { to: '/users', label: 'Users', icon: Users, roles: ['admin', 'manager'] },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/audit-logs', label: 'Audit Logs', icon: Shield, roles: ['admin'] },
  { to: '/timeline', label: 'Timeline', icon: ClipboardList },
  { to: '/profile', label: 'Profile', icon: UserCircle2 },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth();
  const role = user?.role ?? 'developer';

  const visibleLinks = links.filter(
    (link) => !link.roles || link.roles.includes(role),
  );

  return (
    <>
      <button
        type="button"
        aria-label="Close sidebar"
        className={cn(
          'fixed inset-0 z-40 bg-slate-900/40 lg:hidden',
          open ? 'block' : 'hidden',
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <div>
            <p className="text-sm font-semibold text-slate-900">Report Generator</p>
            <p className="text-xs capitalize text-slate-500">{role} workspace</p>
          </div>
          <button
            type="button"
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )
              }
            >
              <link.icon className="size-4 shrink-0" />
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

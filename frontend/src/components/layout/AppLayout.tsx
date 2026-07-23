import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';

const titles: Record<string, string> = {
  '/': 'Dashboard',
  '/projects': 'Projects',
  '/activities': 'Git Activities',
  '/reports': 'Reports',
  '/organization': 'Organization',
  '/users': 'Users',
  '/notifications': 'Notifications',
  '/audit-logs': 'Audit Logs',
  '/timeline': 'Activity Timeline',
  '/profile': 'Profile',
};

function resolveTitle(pathname: string): string {
  if (pathname.startsWith('/reports/')) return 'Report Details';
  return titles[pathname] ?? 'Dashboard';
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          title={resolveTitle(location.pathname)}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

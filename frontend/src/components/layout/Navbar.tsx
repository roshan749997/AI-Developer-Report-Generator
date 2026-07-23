import { LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface NavbarProps {
  title: string;
  onMenuClick: () => void;
}

export function Navbar({ title, onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-slate-900 md:text-lg">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-800">{user?.name}</p>
          <p className="text-xs capitalize text-slate-500">{user?.role}</p>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="size-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}

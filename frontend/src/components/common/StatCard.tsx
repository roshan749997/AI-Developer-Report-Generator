import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  className?: string;
}

export function StatCard({ title, value, hint, icon: Icon, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-5 shadow-sm',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
          {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
        </div>
        <div className="rounded-lg bg-slate-100 p-2.5 text-slate-700">
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-14 text-center',
        className,
      )}
    >
      <div className="mb-3 rounded-full bg-white p-3 shadow-sm">
        <Inbox className="size-5 text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  label?: string;
}

export function LoadingSpinner({ className, label = 'Loading…' }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12', className)}>
      <div className="size-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50/50 px-6 py-12 text-center',
        className,
      )}
    >
      <AlertTriangle className="mb-3 size-6 text-red-500" />
      <h3 className="text-sm font-semibold text-red-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-red-700/80">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

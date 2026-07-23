import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatRelative } from '@/lib/utils';
import { ApiClientError } from '@/services/apiClient';
import { saasApi } from '@/services/saasApi';

export function TimelinePage() {
  const query = useQuery({
    queryKey: ['timeline'],
    queryFn: () => saasApi.listTimeline(),
  });

  if (query.isLoading) return <LoadingSpinner label="Loading timeline…" />;

  if (query.isError) {
    return (
      <ErrorState
        message={
          query.error instanceof ApiClientError
            ? query.error.message
            : 'Failed to load timeline'
        }
        onRetry={() => void query.refetch()}
      />
    );
  }

  const events = query.data ?? [];

  if (events.length === 0) {
    return (
      <EmptyState
        title="No timeline events"
        description="Org activity such as scans, reports, and joins will show here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event.id}
          className="rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge>{event.type.replaceAll('_', ' ')}</Badge>
            <span className="text-xs text-slate-400">
              {formatRelative(event.createdAt)} · {formatDate(event.createdAt, true)}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-900">{event.title}</p>
          {event.description ? (
            <p className="mt-1 text-sm text-slate-600">{event.description}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

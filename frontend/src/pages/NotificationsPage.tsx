import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/ToastContext';
import { formatDate, formatRelative } from '@/lib/utils';
import { ApiClientError } from '@/services/apiClient';
import { saasApi } from '@/services/saasApi';

export function NotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: () => saasApi.listNotifications(),
  });

  const markAll = useMutation({
    mutationFn: () => saasApi.markAllNotificationsRead(),
    onSuccess: async () => {
      toast({ title: 'All notifications marked read', variant: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markOne = useMutation({
    mutationFn: (id: string) => saasApi.markNotificationRead(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  if (query.isLoading) return <LoadingSpinner label="Loading notifications…" />;

  if (query.isError) {
    return (
      <ErrorState
        message={
          query.error instanceof ApiClientError
            ? query.error.message
            : 'Failed to load notifications'
        }
        onRetry={() => void query.refetch()}
      />
    );
  }

  const items = query.data?.items ?? [];
  const unreadCount = query.data?.unreadCount ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{unreadCount} unread</p>
        <Button
          variant="outline"
          size="sm"
          disabled={unreadCount === 0 || markAll.isPending}
          onClick={() => markAll.mutate()}
        >
          Mark all read
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState title="No notifications" description="You're all caught up." />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
            >
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  {!item.isRead ? <Badge variant="warning">New</Badge> : null}
                </div>
                <p className="text-sm text-slate-600">{item.message}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {formatRelative(item.createdAt)} · {formatDate(item.createdAt, true)}
                </p>
              </div>
              {!item.isRead ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markOne.mutate(item.id)}
                >
                  Mark read
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

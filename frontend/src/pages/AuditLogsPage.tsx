import { useQuery } from '@tanstack/react-query';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatDate } from '@/lib/utils';
import { ApiClientError } from '@/services/apiClient';
import { saasApi, type AuditLog } from '@/services/saasApi';

export function AuditLogsPage() {
  const query = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => saasApi.listAuditLogs(),
  });

  const columns: DataTableColumn<AuditLog>[] = [
    {
      key: 'user',
      header: 'User',
      render: (row) => row.userEmail,
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => <code className="text-xs">{row.action}</code>,
    },
    {
      key: 'resource',
      header: 'Resource',
      render: (row) =>
        row.resourceType
          ? `${row.resourceType}${row.resourceId ? `:${row.resourceId.slice(0, 8)}` : ''}`
          : '—',
    },
    {
      key: 'ip',
      header: 'IP',
      render: (row) => row.ip || '—',
    },
    {
      key: 'date',
      header: 'Date',
      render: (row) => formatDate(row.createdAt, true),
    },
  ];

  if (query.isLoading) return <LoadingSpinner label="Loading audit logs…" />;

  if (query.isError) {
    return (
      <ErrorState
        message={
          query.error instanceof ApiClientError
            ? query.error.message
            : 'Failed to load audit logs'
        }
        onRetry={() => void query.refetch()}
      />
    );
  }

  const logs = query.data ?? [];

  if (logs.length === 0) {
    return (
      <EmptyState
        title="No audit logs yet"
        description="Admin actions will appear here."
      />
    );
  }

  return <DataTable columns={columns} rows={logs} rowKey={(row) => row.id} />;
}

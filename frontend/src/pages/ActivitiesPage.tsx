import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAllActivities, useProjects } from '@/hooks/useAppData';
import { formatDate, truncate } from '@/lib/utils';
import { ApiClientError } from '@/services/apiClient';
import type { GitActivity } from '@/types/api';

const PAGE_SIZE = 10;

export function ActivitiesPage() {
  const projectsQuery = useProjects();
  const { activities, isLoading, isError, error } = useAllActivities(projectsQuery.data);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return activities;
    return activities.filter((activity) => {
      const haystack = [
        activity.repositoryName,
        activity.commitMessage,
        activity.author,
        activity.branch,
        activity.commitHash,
        ...activity.changedFiles,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [activities, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const columns: DataTableColumn<GitActivity>[] = [
    {
      key: 'repo',
      header: 'Repository',
      render: (row) => <span className="font-medium">{row.repositoryName}</span>,
    },
    {
      key: 'message',
      header: 'Commit Message',
      render: (row) => (
        <div>
          <p>{truncate(row.commitMessage, 90)}</p>
          <p className="mt-1 font-mono text-[11px] text-slate-400">{row.commitHash.slice(0, 8)}</p>
        </div>
      ),
    },
    {
      key: 'author',
      header: 'Author',
      render: (row) => row.author,
    },
    {
      key: 'branch',
      header: 'Branch',
      render: (row) => <code className="text-xs">{row.branch}</code>,
    },
    {
      key: 'date',
      header: 'Commit Date',
      render: (row) => formatDate(row.commitDate, true),
    },
    {
      key: 'files',
      header: 'Changed Files',
      render: (row) => (
        <div className="max-w-48">
          <p className="font-medium">{row.changedFiles.length}</p>
          <p className="mt-1 text-xs text-slate-500">
            {truncate(row.changedFiles.slice(0, 3).join(', ') || '—', 48)}
          </p>
        </div>
      ),
    },
    {
      key: 'insertions',
      header: 'Insertions',
      render: (row) => <span className="text-emerald-700">+{row.insertions}</span>,
    },
    {
      key: 'deletions',
      header: 'Deletions',
      render: (row) => <span className="text-red-600">-{row.deletions}</span>,
    },
  ];

  if (projectsQuery.isLoading || isLoading) {
    return <LoadingSpinner label="Loading git activities…" />;
  }

  if (projectsQuery.isError || isError) {
    return (
      <ErrorState
        message={
          (error instanceof ApiClientError && error.message) ||
          (projectsQuery.error instanceof ApiClientError
            ? projectsQuery.error.message
            : 'Failed to load activities')
        }
        onRetry={() => void projectsQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Today's GitActivities across all accessible projects.
        </p>
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search commits, authors, files…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No activities found"
          description="Scan a project from the Projects page to collect today's commits."
        />
      ) : (
        <>
          <DataTable columns={columns} rows={paged} rowKey={(row) => row.id} />
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

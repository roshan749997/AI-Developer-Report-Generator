import { Link } from 'react-router-dom';
import {
  Activity,
  Clock3,
  FileText,
  FolderKanban,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  useAllActivities,
  useAllReports,
  useDashboardSummary,
  useProjects,
} from '@/hooks/useAppData';
import { formatDate, formatRelative, truncate } from '@/lib/utils';
import type { GitActivity, ReportListItem } from '@/types/api';
import { ApiClientError } from '@/services/apiClient';
import { saasApi } from '@/services/saasApi';

export function DashboardPage() {
  const { user } = useAuth();
  const roleLabel =
    user?.role === 'admin'
      ? 'Admin Dashboard'
      : user?.role === 'manager'
        ? 'Manager Dashboard'
        : 'Developer Dashboard';

  const projectsQuery = useProjects();
  const summaryQuery = useDashboardSummary();
  const { activities, isLoading: activitiesLoading } = useAllActivities(projectsQuery.data);
  const { reports, todaysReports, isLoading: reportsLoading } = useAllReports(
    projectsQuery.data,
  );
  const timelineQuery = useQuery({
    queryKey: ['timeline', 'dashboard'],
    queryFn: () => saasApi.listTimeline(8),
    enabled: Boolean(user?.organizationId),
    retry: false,
  });

  const loading =
    projectsQuery.isLoading ||
    summaryQuery.isLoading ||
    activitiesLoading ||
    reportsLoading;

  if (loading) {
    return <LoadingSpinner label="Loading dashboard…" />;
  }

  if (projectsQuery.isError || summaryQuery.isError) {
    const message =
      (projectsQuery.error instanceof ApiClientError
        ? projectsQuery.error.message
        : null) ??
      (summaryQuery.error instanceof ApiClientError
        ? summaryQuery.error.message
        : 'Failed to load dashboard');
    return (
      <ErrorState
        message={message}
        onRetry={() => {
          void projectsQuery.refetch();
          void summaryQuery.refetch();
        }}
      />
    );
  }

  const recentActivities = activities.slice(0, 8);
  const recentReports = reports.slice(0, 8);

  const activityColumns: DataTableColumn<GitActivity>[] = [
    {
      key: 'repo',
      header: 'Repository',
      render: (row) => <span className="font-medium">{row.repositoryName}</span>,
    },
    {
      key: 'message',
      header: 'Commit',
      render: (row) => (
        <div>
          <p>{truncate(row.commitMessage, 70)}</p>
          <p className="mt-1 text-xs text-slate-500">{row.author}</p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'When',
      render: (row) => formatRelative(row.commitDate),
    },
  ];

  const reportColumns: DataTableColumn<ReportListItem>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (row) => formatDate(row.reportDate),
    },
    {
      key: 'project',
      header: 'Project',
      render: (row) => row.projectName ?? row.projectId,
    },
    {
      key: 'summary',
      header: 'Summary',
      render: (row) => truncate(row.summary || 'No summary', 90),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button asChild variant="outline" size="sm">
          <Link to={`/reports/${row.projectId}/${row.id}`}>View</Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{roleLabel}</h2>
            <p className="text-sm text-slate-500">
              Signed in as {user?.name} · {user?.role}
              {user?.organizationId ? ' · organization linked' : ' · personal workspace'}
            </p>
          </div>
          {!user?.organizationId ? (
            <Button asChild size="sm">
              <Link to="/organization">Create Organization</Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Projects"
          value={projectsQuery.data?.length ?? 0}
          icon={FolderKanban}
          hint="All accessible projects"
        />
        <StatCard
          title="Today's Commits"
          value={summaryQuery.data?.todaysCommits ?? 0}
          icon={Activity}
          hint={`${summaryQuery.data?.todaysChangedFiles ?? 0} files changed`}
        />
        <StatCard
          title="Today's Reports"
          value={todaysReports.length}
          icon={FileText}
          hint={`${summaryQuery.data?.projectsScanned ?? 0} projects scanned`}
        />
        <StatCard
          title="Last Scan Time"
          value={formatRelative(summaryQuery.data?.latestScanTime)}
          icon={Clock3}
          hint={formatDate(summaryQuery.data?.latestScanTime, true)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Recent Activities</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/activities">View all</Link>
            </Button>
          </div>
          {recentActivities.length === 0 ? (
            <EmptyState
              title="No activity today"
              description="Scan a project repository to collect today's commits."
              action={
                <Button asChild size="sm">
                  <Link to="/projects">Go to Projects</Link>
                </Button>
              }
            />
          ) : (
            <DataTable
              columns={activityColumns}
              rows={recentActivities}
              rowKey={(row) => row.id}
            />
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Recent Reports</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/reports">View all</Link>
            </Button>
          </div>
          {recentReports.length === 0 ? (
            <EmptyState
              title="No reports yet"
              description="Generate a daily report after scanning project activity."
              action={
                <Button asChild size="sm">
                  <Link to="/reports">Open Reports</Link>
                </Button>
              }
            />
          ) : (
            <DataTable
              columns={reportColumns}
              rows={recentReports}
              rowKey={(row) => row.id}
            />
          )}
        </section>
      </div>

      {user?.organizationId ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Activity Timeline</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/timeline">View all</Link>
            </Button>
          </div>
          {(timelineQuery.data ?? []).length === 0 ? (
            <EmptyState
              title="No org events yet"
              description="Project creates, scans, reports, emails, and joins appear here."
            />
          ) : (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
              {(timelineQuery.data ?? []).slice(0, 5).map((event) => (
                <div key={event.id} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-slate-800">{event.title}</p>
                  <p className="text-xs text-slate-500">{formatRelative(event.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success">Live</Badge>
          <p className="text-sm text-slate-600">
            Dashboard metrics are loaded from `/dashboard/summary`, GitActivities, and Reports.
          </p>
        </div>
      </div>
    </div>
  );
}

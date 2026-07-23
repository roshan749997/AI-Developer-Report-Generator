import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/ToastContext';
import { useAllReports, useProjects } from '@/hooks/useAppData';
import { formatDate, truncate } from '@/lib/utils';
import { ApiClientError } from '@/services/apiClient';
import { reportsApi } from '@/services/reportsApi';
import type { Project, ReportListItem } from '@/types/api';

export function ReportsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const projectsQuery = useProjects();
  const { reports, isLoading, isError, error } = useAllReports(projectsQuery.data);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const generateMutation = useMutation({
    mutationFn: (projectId: string) => reportsApi.generate(projectId),
    onSuccess: async (report) => {
      toast({ title: 'Report ready', variant: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['reports'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setSelectedProjectId(report.projectId);
    },
    onError: (err) => {
      toast({
        title: 'Generate failed',
        description: err instanceof ApiClientError ? err.message : 'Unable to generate report',
        variant: 'error',
      });
    },
  });

  const columns: DataTableColumn<ReportListItem>[] = useMemo(
    () => [
      {
        key: 'date',
        header: 'Report Date',
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
        render: (row) => truncate(row.summary || 'No summary', 120),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          <Button asChild variant="outline" size="sm">
            <Link to={`/reports/${row.projectId}/${row.id}`}>View</Link>
          </Button>
        ),
      },
    ],
    [],
  );

  if (projectsQuery.isLoading || isLoading) {
    return <LoadingSpinner label="Loading reports…" />;
  }

  if (projectsQuery.isError || isError) {
    return (
      <ErrorState
        message={
          (error instanceof ApiClientError && error.message) ||
          (projectsQuery.error instanceof ApiClientError
            ? projectsQuery.error.message
            : 'Failed to load reports')
        }
        onRetry={() => void projectsQuery.refetch()}
      />
    );
  }

  const projects = projectsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Generate today's report</label>
          <select
            className="flex h-10 w-full min-w-64 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            value={selectedProjectId}
            onChange={(event) => setSelectedProjectId(event.target.value)}
          >
            <option value="">Select a project</option>
            {projects.map((project: Project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        <Button
          disabled={!selectedProjectId || generateMutation.isPending}
          onClick={() => generateMutation.mutate(selectedProjectId)}
        >
          <Sparkles className="size-4" />
          {generateMutation.isPending ? 'Generating…' : 'Generate Report'}
        </Button>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          title="No reports yet"
          description="Scan a repository, then generate a daily report for a project."
        />
      ) : (
        <DataTable columns={columns} rows={reports} rowKey={(row) => row.id} />
      )}
    </div>
  );
}

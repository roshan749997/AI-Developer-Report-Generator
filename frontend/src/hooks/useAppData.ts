import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { activityApi } from '@/services/activityApi';
import { dashboardApi } from '@/services/dashboardApi';
import { projectsApi } from '@/services/projectsApi';
import { reportsApi } from '@/services/reportsApi';
import { ApiClientError } from '@/services/apiClient';
import { isSameDay } from '@/lib/utils';
import type { DailyReport, GitActivity, Project, ReportListItem } from '@/types/api';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
  });
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => dashboardApi.summary(),
  });
}

export function useAllActivities(projects: Project[] | undefined) {
  const projectIds = projects?.map((project) => project.id) ?? [];

  const queries = useQueries({
    queries: projectIds.map((projectId) => ({
      queryKey: ['activities', projectId],
      queryFn: () => activityApi.today(projectId),
      enabled: projectIds.length > 0,
    })),
  });

  const isLoading = projectIds.length > 0 && queries.some((query) => query.isLoading);
  const isError = queries.some((query) => query.isError);
  const error = queries.find((query) => query.error)?.error ?? null;

  const activities = useMemo(() => {
    const rows: GitActivity[] = [];
    for (const query of queries) {
      if (query.data?.activities) {
        rows.push(...query.data.activities);
      }
    }
    return rows.sort(
      (a, b) => new Date(b.commitDate).getTime() - new Date(a.commitDate).getTime(),
    );
  }, [queries]);

  return { activities, isLoading, isError, error };
}

export function useAllReports(projects: Project[] | undefined) {
  const queries = useQueries({
    queries: (projects ?? []).map((project) => ({
      queryKey: ['reports', 'history', project.id],
      queryFn: async (): Promise<ReportListItem[]> => {
        try {
          const reports = await reportsApi.history(project.id);
          return reports.map((report) => ({
            ...report,
            projectName: project.name,
          }));
        } catch (error) {
          if (error instanceof ApiClientError && error.status === 404) {
            return [];
          }
          throw error;
        }
      },
      enabled: Boolean(projects?.length),
    })),
  });

  const isLoading = Boolean(projects?.length) && queries.some((query) => query.isLoading);
  const isError = queries.some((query) => query.isError);
  const error = queries.find((query) => query.error)?.error;

  const reports = useMemo(() => {
    const rows: ReportListItem[] = [];
    for (const query of queries) {
      if (query.data) rows.push(...query.data);
    }
    return rows.sort(
      (a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime(),
    );
  }, [queries]);

  const todaysReports = useMemo(
    () => reports.filter((report) => isSameDay(report.reportDate)),
    [reports],
  );

  return { reports, todaysReports, isLoading, isError, error };
}

export function useReportDetails(projectId: string | undefined, reportId: string | undefined) {
  const projectQuery = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectsApi.getById(projectId!),
    enabled: Boolean(projectId),
  });

  const historyQuery = useQuery({
    queryKey: ['reports', 'history', projectId],
    queryFn: () => reportsApi.history(projectId!),
    enabled: Boolean(projectId),
  });

  const report = useMemo(() => {
    const list = historyQuery.data ?? [];
    return list.find((item: DailyReport) => item.id === reportId) ?? null;
  }, [historyQuery.data, reportId]);

  return {
    project: projectQuery.data,
    report,
    isLoading: projectQuery.isLoading || historyQuery.isLoading,
    isError: projectQuery.isError || historyQuery.isError,
    error: projectQuery.error ?? historyQuery.error,
    refetch: () => {
      void projectQuery.refetch();
      void historyQuery.refetch();
    },
  };
}

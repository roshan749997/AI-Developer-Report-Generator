import { apiClient } from '@/services/apiClient';
import type { ProjectActivityResult, ScanActivityResult } from '@/types/api';

export const activityApi = {
  scan: (projectId: string) =>
    apiClient.post<ScanActivityResult>(`/projects/${projectId}/scan`),

  today: (projectId: string) =>
    apiClient.get<ProjectActivityResult>(`/projects/${projectId}/activity`),
};

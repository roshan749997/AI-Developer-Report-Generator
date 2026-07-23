import { apiClient } from '@/services/apiClient';
import type { DashboardSummary } from '@/types/api';

export const dashboardApi = {
  summary: () => apiClient.get<DashboardSummary>('/dashboard/summary'),
};

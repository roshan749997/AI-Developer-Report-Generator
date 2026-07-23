import { apiClient } from '@/services/apiClient';
import type {
  CreateProjectPayload,
  Project,
  UpdateProjectPayload,
} from '@/types/api';

export const projectsApi = {
  list: (params?: { search?: string; isEnabled?: boolean; mine?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.isEnabled !== undefined) query.set('isEnabled', String(params.isEnabled));
    if (params?.mine !== undefined) query.set('mine', String(params.mine));
    const qs = query.toString();
    return apiClient.get<Project[]>(`/projects${qs ? `?${qs}` : ''}`);
  },

  getById: (id: string) => apiClient.get<Project>(`/projects/${id}`),

  create: (payload: CreateProjectPayload) =>
    apiClient.post<Project>('/projects', payload),

  update: (id: string, payload: UpdateProjectPayload) =>
    apiClient.patch<Project>(`/projects/${id}`, payload),

  remove: (id: string) => apiClient.delete<null>(`/projects/${id}`),

  enable: (id: string) => apiClient.post<Project>(`/projects/${id}/enable`),

  disable: (id: string) => apiClient.post<Project>(`/projects/${id}/disable`),
};

import { apiClient } from '@/services/apiClient';

export interface EmailLog {
  id: string;
  projectId: string;
  reportId: string;
  recipient: string;
  subject: string;
  status: 'sent' | 'failed';
  error: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const emailApi = {
  logs: (limit = 50) => apiClient.get<EmailLog[]>(`/email/logs?limit=${limit}`),
};

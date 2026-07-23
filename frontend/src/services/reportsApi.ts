import { apiClient, axiosInstance, ApiClientError } from '@/services/apiClient';
import type { DailyReport } from '@/types/api';

export type ReportExportFormat = 'pdf' | 'docx' | 'md';

function filenameFromDisposition(header: string | undefined, fallback: string): string {
  if (!header) return fallback;
  const match = /filename="?([^"]+)"?/i.exec(header);
  return match?.[1] ?? fallback;
}

async function messageFromBlobError(error: unknown): Promise<string> {
  if (!(error instanceof ApiClientError)) {
    return 'Failed to download export';
  }

  const details = error.details;
  if (details instanceof Blob) {
    try {
      const text = await details.text();
      const parsed = JSON.parse(text) as { message?: string };
      return parsed.message ?? error.message;
    } catch {
      return error.message;
    }
  }

  return error.message;
}

export const reportsApi = {
  generate: (projectId: string) =>
    apiClient.post<DailyReport>(`/reports/generate/${projectId}`),

  today: (projectId: string) =>
    apiClient.get<DailyReport>(`/reports/${projectId}/today`),

  history: (projectId: string) =>
    apiClient.get<DailyReport[]>(`/reports/history/${projectId}`),

  downloadExport: async (reportId: string, format: ReportExportFormat) => {
    try {
      const response = await axiosInstance.get(`/reports/${reportId}/export/${format}`, {
        responseType: 'blob',
      });

      const fallback = `daily-report.${format === 'md' ? 'md' : format}`;
      const filename = filenameFromDisposition(
        response.headers['content-disposition'] as string | undefined,
        fallback,
      );

      return {
        blob: response.data as Blob,
        filename,
        contentType: (response.headers['content-type'] as string | undefined) ?? '',
      };
    } catch (error) {
      const message = await messageFromBlobError(error);
      if (error instanceof ApiClientError) {
        throw new ApiClientError(message, error.status, error.code, error.details);
      }
      throw new ApiClientError(message, 0);
    }
  },

  sendEmail: (reportId: string, recipients: string[]) =>
    apiClient.post<{
      reportId: string;
      projectId: string;
      subject: string;
      recipients: string[];
      sent: number;
      failed: number;
    }>(`/reports/${reportId}/email`, { recipients }),
};

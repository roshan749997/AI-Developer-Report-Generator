export interface ScanSchedule {
  id: string;
  projectId: string;
  ownerId: string;
  name: string;
  cronExpression: string;
  timezone: string;
  isEnabled: boolean;
  scanTodayOnly: boolean;
  lookbackDays: number;
  lastRunAt?: Date | null;
  lastRunStatus?: 'success' | 'failed' | null;
  lastError?: string | null;
  nextRunAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

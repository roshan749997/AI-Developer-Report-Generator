export const ScanRunStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type ScanRunStatus = (typeof ScanRunStatus)[keyof typeof ScanRunStatus];

export const ScanTrigger = {
  MANUAL: 'manual',
  SCHEDULE: 'schedule',
  API: 'api',
} as const;

export type ScanTrigger = (typeof ScanTrigger)[keyof typeof ScanTrigger];

export interface ScanRun {
  id: string;
  projectId: string;
  scheduleId?: string | null;
  triggeredByUserId?: string | null;
  trigger: ScanTrigger;
  status: ScanRunStatus;
  branch: string;
  fromDate?: Date | null;
  toDate?: Date | null;
  commitsScanned: number;
  commitsUpserted: number;
  errorMessage?: string | null;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

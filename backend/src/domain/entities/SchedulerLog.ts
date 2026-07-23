export const SchedulerJobType = {
  DAILY_REPORT: 'daily_report',
} as const;

export type SchedulerJobType =
  (typeof SchedulerJobType)[keyof typeof SchedulerJobType];

export const SchedulerLogStatus = {
  RUNNING: 'running',
  SUCCESS: 'success',
  FAILED: 'failed',
  SKIPPED: 'skipped',
} as const;

export type SchedulerLogStatus =
  (typeof SchedulerLogStatus)[keyof typeof SchedulerLogStatus];

export interface SchedulerLog {
  id: string;
  projectId: string | null;
  jobType: SchedulerJobType;
  status: SchedulerLogStatus;
  startedAt: Date;
  finishedAt: Date | null;
  duration: number | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}

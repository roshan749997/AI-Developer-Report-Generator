import type {
  SchedulerJobType,
  SchedulerLog,
  SchedulerLogStatus,
} from '../entities/SchedulerLog.js';

export interface CreateSchedulerLogInput {
  projectId?: string | null;
  jobType: SchedulerJobType;
  status: SchedulerLogStatus;
  startedAt: Date;
  finishedAt?: Date | null;
  duration?: number | null;
  error?: string | null;
}

export interface UpdateSchedulerLogInput {
  status?: SchedulerLogStatus;
  finishedAt?: Date | null;
  duration?: number | null;
  error?: string | null;
}

export interface ListSchedulerLogsFilter {
  projectId?: string;
  jobType?: SchedulerJobType;
  status?: SchedulerLogStatus;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
}

export interface SchedulerLogStats {
  generated: number;
  failed: number;
  skipped: number;
}

export interface ISchedulerLogRepository {
  create(input: CreateSchedulerLogInput): Promise<SchedulerLog>;
  update(id: string, input: UpdateSchedulerLogInput): Promise<SchedulerLog | null>;
  list(filter?: ListSchedulerLogsFilter): Promise<SchedulerLog[]>;
  getLatest(jobType?: SchedulerJobType): Promise<SchedulerLog | null>;
  getTodayStats(
    jobType: SchedulerJobType,
    fromDate: Date,
    toDate: Date,
  ): Promise<SchedulerLogStats>;
}

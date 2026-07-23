import type { ISchedulerLogRepository } from '../../../domain/repositories/ISchedulerLogRepository.js';
import type { SchedulerLog } from '../../../domain/entities/SchedulerLog.js';
import { SchedulerJobType } from '../../../domain/entities/SchedulerLog.js';
import type { JobScheduler } from '../../../jobs/scheduler.js';
import type { DailyReportJobResult } from '../../../jobs/dailyReport.job.js';
import { getKolkataTodayRange } from '../../../jobs/kolkataTime.js';

export interface JobsStatusResponse {
  schedulerRunning: boolean;
  jobRunning: boolean;
  lastRun: Date | null;
  nextRun: Date | null;
  todaysGeneratedReports: number;
  todaysFailedReports: number;
  todaysSkippedReports: number;
  cronExpression: string;
  timezone: string;
  lastResult: DailyReportJobResult | null;
}

export class JobsService {
  constructor(
    private readonly scheduler: JobScheduler,
    private readonly logs: ISchedulerLogRepository,
  ) {}

  async getStatus(): Promise<JobsStatusResponse> {
    const status = this.scheduler.getStatus();
    const { fromDate, toDate } = getKolkataTodayRange();
    const stats = await this.logs.getTodayStats(
      SchedulerJobType.DAILY_REPORT,
      fromDate,
      toDate,
    );

    return {
      schedulerRunning: status.schedulerRunning,
      jobRunning: status.jobRunning,
      lastRun: status.lastRun,
      nextRun: status.nextRun,
      todaysGeneratedReports: stats.generated,
      todaysFailedReports: stats.failed,
      todaysSkippedReports: stats.skipped,
      cronExpression: status.cronExpression,
      timezone: status.timezone,
      lastResult: status.lastResult,
    };
  }

  async getLogs(limit = 50): Promise<SchedulerLog[]> {
    return this.logs.list({
      jobType: SchedulerJobType.DAILY_REPORT,
      limit,
    });
  }

  async runNow(): Promise<DailyReportJobResult> {
    return this.scheduler.trigger('manual');
  }
}

import cron, { type ScheduledTask } from 'node-cron';
import { env } from '../config/env.js';
import { logger } from '../infrastructure/logger/index.js';
import type { DailyReportJob, DailyReportJobResult } from './dailyReport.job.js';
import { getNextKolkataEightPm, KOLKATA_TZ } from './kolkataTime.js';

export interface JobSchedulerStatus {
  schedulerRunning: boolean;
  jobRunning: boolean;
  cronExpression: string;
  timezone: string;
  lastRun: Date | null;
  nextRun: Date | null;
  lastResult: DailyReportJobResult | null;
}

/**
 * node-cron scheduler for the daily report automation job.
 * Default: every day at 20:00 Asia/Kolkata.
 */
export class JobScheduler {
  private task: ScheduledTask | null = null;
  private started = false;
  private lastRun: Date | null = null;
  private lastResult: DailyReportJobResult | null = null;

  constructor(private readonly dailyReportJob: DailyReportJob) {}

  start(): void {
    if (this.started) {
      return;
    }

    if (!env.DAILY_REPORT_SCHEDULER_ENABLED) {
      logger.warn('Daily report scheduler is disabled via env');
      return;
    }

    const expression = env.DAILY_REPORT_CRON;
    const timezone = env.DAILY_REPORT_TIMEZONE || KOLKATA_TZ;

    if (!cron.validate(expression)) {
      logger.error({ expression }, 'Invalid DAILY_REPORT_CRON expression');
      return;
    }

    this.task = cron.schedule(
      expression,
      () => {
        void this.trigger('cron');
      },
      { timezone },
    );

    this.started = true;
    logger.info(
      {
        expression,
        timezone,
        nextRun: getNextKolkataEightPm().toISOString(),
      },
      'Daily report scheduler started',
    );
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
    }
    this.started = false;
    logger.info('Daily report scheduler stopped');
  }

  async trigger(source: 'cron' | 'manual' = 'manual'): Promise<DailyReportJobResult> {
    logger.info({ source }, 'Daily report job trigger received');
    const result = await this.dailyReportJob.run();
    this.lastRun = result.finishedAt;
    this.lastResult = result;
    return result;
  }

  getStatus(): JobSchedulerStatus {
    return {
      schedulerRunning: this.started,
      jobRunning: this.dailyReportJob.isRunning(),
      cronExpression: env.DAILY_REPORT_CRON,
      timezone: env.DAILY_REPORT_TIMEZONE || KOLKATA_TZ,
      lastRun: this.lastRun,
      nextRun: this.started ? getNextKolkataEightPm() : null,
      lastResult: this.lastResult,
    };
  }
}

import cron, { type ScheduledTask } from 'node-cron';
import type { IScanScheduleRepository } from '../../domain/repositories/IScanScheduleRepository.js';
import type { ScanSchedule } from '../../domain/entities/ScanSchedule.js';
import { ScanTrigger } from '../../domain/entities/ScanRun.js';
import type { ScanProjectUseCase } from '../../application/use-cases/scanner/ScanProjectUseCase.js';
import { logger } from '../logger/index.js';

export class ScanSchedulerService {
  private readonly tasks = new Map<string, ScheduledTask>();
  private started = false;

  constructor(
    private readonly schedules: IScanScheduleRepository,
    private readonly scanProject: ScanProjectUseCase,
  ) {}

  async start(): Promise<void> {
    if (this.started) {
      return;
    }
    this.started = true;

    const enabled = await this.schedules.listEnabled();
    for (const schedule of enabled) {
      this.register(schedule);
    }

    logger.info({ count: enabled.length }, 'Scan scheduler started');
  }

  stop(): void {
    for (const [id, task] of this.tasks.entries()) {
      task.stop();
      this.tasks.delete(id);
    }
    this.started = false;
    logger.info('Scan scheduler stopped');
  }

  register(schedule: ScanSchedule): void {
    this.unregister(schedule.id);

    if (!schedule.isEnabled) {
      return;
    }

    if (!cron.validate(schedule.cronExpression)) {
      logger.warn(
        { scheduleId: schedule.id, cron: schedule.cronExpression },
        'Skipping invalid cron schedule',
      );
      return;
    }

    const task = cron.schedule(
      schedule.cronExpression,
      () => {
        void this.runSchedule(schedule.id);
      },
      {
        timezone: schedule.timezone || 'UTC',
      },
    );

    this.tasks.set(schedule.id, task);
    logger.info(
      { scheduleId: schedule.id, cron: schedule.cronExpression },
      'Registered scan schedule',
    );
  }

  unregister(scheduleId: string): void {
    const existing = this.tasks.get(scheduleId);
    if (existing) {
      existing.stop();
      this.tasks.delete(scheduleId);
    }
  }

  async refresh(scheduleId: string): Promise<void> {
    const schedule = await this.schedules.findById(scheduleId);
    if (!schedule || !schedule.isEnabled) {
      this.unregister(scheduleId);
      return;
    }
    this.register(schedule);
  }

  async runSchedule(scheduleId: string): Promise<void> {
    const schedule = await this.schedules.findById(scheduleId);
    if (!schedule || !schedule.isEnabled) {
      return;
    }

    logger.info({ scheduleId, projectId: schedule.projectId }, 'Running scheduled git scan');

    try {
      await this.scanProject.execute({
        projectId: schedule.projectId,
        scheduleId: schedule.id,
        trigger: ScanTrigger.SCHEDULE,
        todayOnly: schedule.scanTodayOnly,
        lookbackDays: schedule.scanTodayOnly ? undefined : schedule.lookbackDays,
      });

      await this.schedules.update(schedule.id, {
        lastRunAt: new Date(),
        lastRunStatus: 'success',
        lastError: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Scheduled scan failed';
      logger.error({ err: error, scheduleId }, 'Scheduled git scan failed');
      await this.schedules.update(schedule.id, {
        lastRunAt: new Date(),
        lastRunStatus: 'failed',
        lastError: message,
      });
    }
  }

  listActiveScheduleIds(): string[] {
    return [...this.tasks.keys()];
  }
}

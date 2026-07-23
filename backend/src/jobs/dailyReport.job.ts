import type { IProjectRepository } from '../domain/repositories/IProjectRepository.js';
import type { IGitActivityRepository } from '../domain/repositories/IGitActivityRepository.js';
import type { IDailyReportRepository } from '../domain/repositories/IDailyReportRepository.js';
import type { ISchedulerLogRepository } from '../domain/repositories/ISchedulerLogRepository.js';
import {
  SchedulerJobType,
  SchedulerLogStatus,
} from '../domain/entities/SchedulerLog.js';
import type { GitScannerService } from '../infrastructure/git/GitScannerService.js';
import type { GeminiReportClient } from '../infrastructure/ai/GeminiReportClient.js';
import { EMPTY_DAILY_REPORT_CONTENT } from '../infrastructure/ai/dailyReportSchema.js';
import { logger } from '../infrastructure/logger/index.js';
import { getKolkataTodayRange } from './kolkataTime.js';

export interface DailyReportJobResult {
  totalProjects: number;
  generated: number;
  skipped: number;
  failed: number;
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;
}

/**
 * Daily automation job:
 * enabled projects → scan activities → generate Gemini report (idempotent).
 */
export class DailyReportJob {
  private running = false;

  constructor(
    private readonly projects: IProjectRepository,
    private readonly activities: IGitActivityRepository,
    private readonly reports: IDailyReportRepository,
    private readonly logs: ISchedulerLogRepository,
    private readonly scanner: GitScannerService,
    private readonly gemini: GeminiReportClient,
  ) {}

  isRunning(): boolean {
    return this.running;
  }

  async run(): Promise<DailyReportJobResult> {
    if (this.running) {
      logger.warn('Daily report job already running — skipping overlapping trigger');
      return {
        totalProjects: 0,
        generated: 0,
        skipped: 0,
        failed: 0,
        startedAt: new Date(),
        finishedAt: new Date(),
        durationMs: 0,
      };
    }

    this.running = true;
    const batchStartedAt = new Date();
    const { fromDate, toDate, dateString } = getKolkataTodayRange(batchStartedAt);

    logger.info(
      { dateString, fromDate, toDate },
      'Daily report job started',
    );

    const batchLog = await this.logs.create({
      projectId: null,
      jobType: SchedulerJobType.DAILY_REPORT,
      status: SchedulerLogStatus.RUNNING,
      startedAt: batchStartedAt,
    });

    let generated = 0;
    let skipped = 0;
    let failed = 0;

    try {
      const enabledProjects = await this.projects.list({ isEnabled: true });

      for (const project of enabledProjects) {
        const projectStartedAt = new Date();
        const projectLog = await this.logs.create({
          projectId: project.id,
          jobType: SchedulerJobType.DAILY_REPORT,
          status: SchedulerLogStatus.RUNNING,
          startedAt: projectStartedAt,
        });

        try {
          const existing = await this.reports.findByProjectAndDate(
            project.id,
            fromDate,
          );

          if (existing) {
            skipped += 1;
            const finishedAt = new Date();
            await this.logs.update(projectLog.id, {
              status: SchedulerLogStatus.SKIPPED,
              finishedAt,
              duration: finishedAt.getTime() - projectStartedAt.getTime(),
              error: null,
            });
            logger.info(
              { projectId: project.id, reportId: existing.id },
              'Skipped project — today\'s report already exists',
            );
            continue;
          }

          // 1) Scan today's git commits → GitActivities (no full diffs)
          const scanned = await this.scanner.scanActivityMetadata(
            project.localGitPath,
            {
              branch: project.gitBranch,
              fromDate,
              toDate,
            },
          );

          await this.activities.upsertMany(
            scanned.map((commit) => ({
              projectId: project.id,
              repositoryName: project.name,
              branch: commit.branch,
              commitHash: commit.commitHash,
              commitMessage: commit.commitMessage,
              author: commit.author,
              commitDate: commit.authoredAt,
              changedFiles: commit.changedFiles,
              insertions: commit.insertions,
              deletions: commit.deletions,
            })),
          );

          const activities = await this.activities.listByProject({
            projectId: project.id,
            fromDate,
            toDate,
          });

          // 2) Generate AI report (or empty report when no activity)
          if (activities.length === 0) {
            await this.reports.create({
              projectId: project.id,
              reportDate: fromDate,
              ...EMPTY_DAILY_REPORT_CONTENT,
              summary: 'No Git activities were found for today.',
              rawAIResponse: JSON.stringify({
                ...EMPTY_DAILY_REPORT_CONTENT,
                summary: 'No Git activities were found for today.',
              }),
            });
          } else {
            const aiResult = await this.gemini.generateDailyReport({
              projectName: project.name,
              reportDate: fromDate,
              activities,
            });

            try {
              await this.reports.create({
                projectId: project.id,
                reportDate: fromDate,
                completedTasks: aiResult.content.completedTasks,
                workInProgress: aiResult.content.workInProgress,
                pendingTasks: aiResult.content.pendingTasks,
                challenges: aiResult.content.challenges,
                tomorrowPlan: aiResult.content.tomorrowPlan,
                summary: aiResult.content.summary,
                rawAIResponse: aiResult.rawAIResponse,
              });
            } catch {
              // Race / unique index — treat as already generated
              const raced = await this.reports.findByProjectAndDate(
                project.id,
                fromDate,
              );
              if (!raced) {
                throw new Error('Failed to save daily report');
              }
            }
          }

          generated += 1;
          const finishedAt = new Date();
          await this.logs.update(projectLog.id, {
            status: SchedulerLogStatus.SUCCESS,
            finishedAt,
            duration: finishedAt.getTime() - projectStartedAt.getTime(),
            error: null,
          });

          logger.info(
            {
              projectId: project.id,
              commits: scanned.length,
              activities: activities.length,
            },
            'Daily report generated for project',
          );
        } catch (error) {
          failed += 1;
          const message =
            error instanceof Error ? error.message : 'Daily report job failed';
          const finishedAt = new Date();
          await this.logs.update(projectLog.id, {
            status: SchedulerLogStatus.FAILED,
            finishedAt,
            duration: finishedAt.getTime() - projectStartedAt.getTime(),
            error: message,
          });
          logger.error(
            { err: error, projectId: project.id },
            'Daily report job failed for project — continuing',
          );
        }
      }

      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - batchStartedAt.getTime();
      const batchStatus =
        failed > 0 && generated === 0 && skipped === 0
          ? SchedulerLogStatus.FAILED
          : SchedulerLogStatus.SUCCESS;

      await this.logs.update(batchLog.id, {
        status: batchStatus,
        finishedAt,
        duration: durationMs,
        error:
          failed > 0
            ? `${failed} project(s) failed during daily report job`
            : null,
      });

      const result: DailyReportJobResult = {
        totalProjects: enabledProjects.length,
        generated,
        skipped,
        failed,
        startedAt: batchStartedAt,
        finishedAt,
        durationMs,
      };

      logger.info(result, 'Daily report job finished');
      return result;
    } catch (error) {
      const finishedAt = new Date();
      const message =
        error instanceof Error ? error.message : 'Daily report batch failed';
      await this.logs.update(batchLog.id, {
        status: SchedulerLogStatus.FAILED,
        finishedAt,
        duration: finishedAt.getTime() - batchStartedAt.getTime(),
        error: message,
      });
      logger.error({ err: error }, 'Daily report job batch failed');
      throw error;
    } finally {
      this.running = false;
    }
  }
}

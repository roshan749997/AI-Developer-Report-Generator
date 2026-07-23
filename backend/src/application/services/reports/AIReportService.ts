import type { IProjectRepository } from '../../../domain/repositories/IProjectRepository.js';
import type { IGitActivityRepository } from '../../../domain/repositories/IGitActivityRepository.js';
import type { IDailyReportRepository } from '../../../domain/repositories/IDailyReportRepository.js';
import type { DailyReport } from '../../../domain/entities/DailyReport.js';
import type { UserRole } from '../../../domain/entities/User.js';
import type { GeminiReportClient } from '../../../infrastructure/ai/GeminiReportClient.js';
import type { GitScannerService } from '../../../infrastructure/git/GitScannerService.js';
import { BadRequestError, NotFoundError } from '../../../shared/errors/index.js';
import { getAccessibleProject } from '../../use-cases/projects/projectAccess.js';
import { logger } from '../../../infrastructure/logger/index.js';
import { EMPTY_DAILY_REPORT_CONTENT } from '../../../infrastructure/ai/dailyReportSchema.js';

export interface GenerateDailyReportInput {
  projectId: string;
  actor: { id: string; role: UserRole };
}

/**
 * Generates (or returns existing) daily work report from today's GitActivities.
 */
export class AIReportService {
  constructor(
    private readonly projects: IProjectRepository,
    private readonly activities: IGitActivityRepository,
    private readonly reports: IDailyReportRepository,
    private readonly gemini: GeminiReportClient,
    private readonly scanner: GitScannerService,
  ) {}

  async generate(input: GenerateDailyReportInput): Promise<DailyReport> {
    const project = await getAccessibleProject(
      this.projects,
      input.projectId,
      input.actor,
    );

    const { fromDate, toDate } = this.scanner.getTodayRange();
    const reportDate = fromDate;

    const existing = await this.reports.findByProjectAndDate(project.id, reportDate);
    if (existing) {
      return existing;
    }

    const activities = await this.activities.listByProject({
      projectId: project.id,
      fromDate,
      toDate,
    });

    if (activities.length === 0) {
      const emptyReport = await this.reports.create({
        projectId: project.id,
        reportDate,
        ...EMPTY_DAILY_REPORT_CONTENT,
        summary: 'No Git activities were found for today.',
        rawAIResponse: JSON.stringify({
          ...EMPTY_DAILY_REPORT_CONTENT,
          summary: 'No Git activities were found for today.',
          importantNotes: [
            'No GitActivities for today. Scan the repository before generating a report.',
          ],
        }),
      });

      logger.info(
        { projectId: project.id, reportId: emptyReport.id },
        'Empty daily report saved (no activities)',
      );

      return emptyReport;
    }

    const aiResult = await this.gemini.generateDailyReport({
      projectName: project.name,
      reportDate,
      activities,
    });

    try {
      const saved = await this.reports.create({
        projectId: project.id,
        reportDate,
        completedTasks: aiResult.content.completedTasks,
        workInProgress: aiResult.content.workInProgress,
        pendingTasks: aiResult.content.pendingTasks,
        challenges: aiResult.content.challenges,
        tomorrowPlan: aiResult.content.tomorrowPlan,
        summary: aiResult.content.summary,
        rawAIResponse: aiResult.rawAIResponse,
      });

      logger.info(
        {
          projectId: project.id,
          reportId: saved.id,
          activities: activities.length,
          model: aiResult.model,
        },
        'Daily report generated with Gemini',
      );

      return saved;
    } catch (error) {
      // Unique index race: another request created today's report first.
      const raced = await this.reports.findByProjectAndDate(project.id, reportDate);
      if (raced) {
        return raced;
      }

      const message =
        error instanceof Error ? error.message : 'Failed to save daily report';
      throw new BadRequestError(message);
    }
  }

  async getToday(
    projectId: string,
    actor: { id: string; role: UserRole },
  ): Promise<DailyReport> {
    const project = await getAccessibleProject(this.projects, projectId, actor);
    const { fromDate } = this.scanner.getTodayRange();
    const report = await this.reports.findByProjectAndDate(project.id, fromDate);

    if (!report) {
      throw new NotFoundError("Today's report was not found for this project");
    }

    return report;
  }

  async getHistory(
    projectId: string,
    actor: { id: string; role: UserRole },
  ): Promise<DailyReport[]> {
    const project = await getAccessibleProject(this.projects, projectId, actor);
    return this.reports.listByProject(project.id);
  }
}

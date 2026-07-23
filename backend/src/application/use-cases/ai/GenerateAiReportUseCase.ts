import { env } from '../../../config/env.js';
import type { IProjectRepository } from '../../../domain/repositories/IProjectRepository.js';
import type { IScannedCommitRepository } from '../../../domain/repositories/IScannedCommitRepository.js';
import type { IAiReportRepository } from '../../../domain/repositories/IAiReportRepository.js';
import type { UserRole } from '../../../domain/entities/User.js';
import type { AiReport, AiReportCommitSnapshot } from '../../../domain/entities/AiReport.js';
import { AiReportStatus } from '../../../domain/entities/AiReport.js';
import type { OpenAiResponsesClient } from '../../../infrastructure/ai/OpenAiResponsesClient.js';
import { BadRequestError } from '../../../shared/errors/index.js';
import { getAccessibleProject } from '../projects/projectAccess.js';
import { logger } from '../../../infrastructure/logger/index.js';

export interface GenerateAiReportInput {
  projectId: string;
  actor: { id: string; role: UserRole };
  fromDate?: Date;
  toDate?: Date;
  todayOnly?: boolean;
  commitLimit?: number;
  previousReportsLimit?: number;
}

function startOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function toCommitSnapshot(
  commit: {
    commitHash: string;
    shortHash: string;
    authorName: string;
    authorEmail: string;
    authoredAt: Date;
    branch: string;
    commitMessage: string;
    changedFiles: string[];
    renamedFiles: string[];
    deletedFiles: string[];
    insertions: number;
    deletions: number;
    categories: string[];
    gitDiff: string;
  },
  excerptChars: number,
): AiReportCommitSnapshot {
  return {
    commitHash: commit.commitHash,
    shortHash: commit.shortHash,
    authorName: commit.authorName,
    authorEmail: commit.authorEmail,
    authoredAt: commit.authoredAt,
    branch: commit.branch,
    commitMessage: commit.commitMessage,
    changedFiles: commit.changedFiles,
    renamedFiles: commit.renamedFiles,
    deletedFiles: commit.deletedFiles,
    insertions: commit.insertions,
    deletions: commit.deletions,
    categories: commit.categories,
    gitDiffExcerpt:
      excerptChars <= 0 ? '' : commit.gitDiff.slice(0, excerptChars),
  };
}

export class GenerateAiReportUseCase {
  constructor(
    private readonly projects: IProjectRepository,
    private readonly commits: IScannedCommitRepository,
    private readonly reports: IAiReportRepository,
    private readonly ai: OpenAiResponsesClient,
  ) {}

  async execute(input: GenerateAiReportInput): Promise<AiReport> {
    const project = await getAccessibleProject(
      this.projects,
      input.projectId,
      input.actor,
    );

    let fromDate = input.fromDate;
    let toDate = input.toDate;

    if (input.todayOnly || (!fromDate && !toDate)) {
      const now = new Date();
      fromDate = startOfDay(now);
      toDate = endOfDay(now);
    }

    if (!fromDate || !toDate) {
      throw new BadRequestError('fromDate and toDate are required');
    }

    if (fromDate > toDate) {
      throw new BadRequestError('fromDate must be before toDate');
    }

    const commitLimit = input.commitLimit ?? env.AI_MAX_COMMITS_PER_REPORT;
    const previousLimit =
      input.previousReportsLimit ?? env.AI_PREVIOUS_REPORTS_LIMIT;

    const [commits, previous] = await Promise.all([
      this.commits.list({
        projectId: project.id,
        fromDate,
        toDate,
        limit: commitLimit,
      }),
      this.reports.listPreviousSummaries(project.id, previousLimit),
    ]);

    const inputCommits = commits.map((commit) =>
      toCommitSnapshot(commit, env.AI_DIFF_EXCERPT_CHARS),
    );

    const previousReports = previous.map((report) => ({
      reportId: report.id,
      reportDate: report.reportDate,
      summary: report.content.summary,
      tasksCompleted: report.content.tasksCompleted,
      workInProgress: report.content.workInProgress,
      pendingTasks: report.content.pendingTasks,
      tomorrowPlan: report.content.tomorrowPlan,
    }));

    if (inputCommits.length === 0) {
      // Still produce a deterministic empty report without calling OpenAI.
      return this.reports.create({
        projectId: project.id,
        projectName: project.name,
        generatedByUserId: input.actor.id,
        status: AiReportStatus.COMPLETED,
        reportDate: new Date(),
        fromDate,
        toDate,
        model: 'none',
        openaiResponseId: null,
        content: {
          tasksCompleted: [],
          workInProgress: [],
          pendingTasks: [],
          challenges: [],
          tomorrowPlan: [],
          summary: 'No commits were found in the selected date range.',
          importantNotes: [
            'No scanned commits were available for this window. Scan the repository before generating a report.',
          ],
        },
        inputCommits: [],
        previousReports,
        promptVersion: 'v1.1.0-empty',
        rawOutput: null,
        errorMessage: null,
        usage: null,
      });
    }

    try {
      const aiResult = await this.ai.generateDeveloperReport({
        projectName: project.name,
        fromDate,
        toDate,
        commits: inputCommits,
        previousReports,
      });

      const saved = await this.reports.create({
        projectId: project.id,
        projectName: project.name,
        generatedByUserId: input.actor.id,
        status: AiReportStatus.COMPLETED,
        reportDate: new Date(),
        fromDate,
        toDate,
        model: aiResult.model,
        openaiResponseId: aiResult.responseId,
        content: aiResult.content,
        inputCommits,
        previousReports,
        promptVersion: aiResult.promptVersion,
        rawOutput: aiResult.rawOutput,
        errorMessage: null,
        usage: aiResult.usage ?? null,
      });

      logger.info(
        {
          projectId: project.id,
          reportId: saved.id,
          commits: inputCommits.length,
        },
        'AI report generated',
      );

      return saved;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI report generation failed';

      await this.reports.create({
        projectId: project.id,
        projectName: project.name,
        generatedByUserId: input.actor.id,
        status: AiReportStatus.FAILED,
        reportDate: new Date(),
        fromDate,
        toDate,
        model: env.OPENAI_MODEL,
        openaiResponseId: null,
        content: {
          tasksCompleted: [],
          workInProgress: [],
          pendingTasks: [],
          challenges: [],
          tomorrowPlan: [],
          summary: '',
          importantNotes: [],
        },
        inputCommits,
        previousReports,
        promptVersion: 'v1.1.0',
        rawOutput: null,
        errorMessage: message,
        usage: null,
      });

      throw error;
    }
  }
}

import type { IProjectRepository } from '../../../domain/repositories/IProjectRepository.js';
import type { IScannedCommitRepository } from '../../../domain/repositories/IScannedCommitRepository.js';
import type { IScanRunRepository } from '../../../domain/repositories/IScanRunRepository.js';
import { ScanRunStatus, ScanTrigger } from '../../../domain/entities/ScanRun.js';
import type { ScanRun } from '../../../domain/entities/ScanRun.js';
import type { UserRole } from '../../../domain/entities/User.js';
import type { GitScannerService } from '../../../infrastructure/git/GitScannerService.js';
import { BadRequestError } from '../../../shared/errors/index.js';
import { getAccessibleProject } from '../projects/projectAccess.js';
import { logger } from '../../../infrastructure/logger/index.js';

export interface ScanProjectInput {
  projectId: string;
  actor?: { id: string; role: UserRole };
  scheduleId?: string | null;
  trigger: (typeof ScanTrigger)[keyof typeof ScanTrigger];
  fromDate?: Date;
  toDate?: Date;
  maxCount?: number;
  todayOnly?: boolean;
  yesterdayOnly?: boolean;
  lookbackDays?: number;
}

export interface ScanProjectResult {
  run: ScanRun;
  commitsScanned: number;
  commitsUpserted: number;
}

export class ScanProjectUseCase {
  constructor(
    private readonly projects: IProjectRepository,
    private readonly commits: IScannedCommitRepository,
    private readonly runs: IScanRunRepository,
    private readonly scanner: GitScannerService,
  ) {}

  async execute(input: ScanProjectInput): Promise<ScanProjectResult> {
    const project = input.actor
      ? await getAccessibleProject(this.projects, input.projectId, input.actor)
      : await this.projects.findById(input.projectId);

    if (!project) {
      throw new BadRequestError('Project not found');
    }

    if (!project.isEnabled) {
      throw new BadRequestError('Project is disabled');
    }

    let fromDate = input.fromDate;
    let toDate = input.toDate;

    if (input.todayOnly) {
      const range = this.scanner.getTodayRange();
      fromDate = range.fromDate;
      toDate = range.toDate;
    } else if (input.yesterdayOnly) {
      const range = this.scanner.getYesterdayRange();
      fromDate = range.fromDate;
      toDate = range.toDate;
    } else if (input.lookbackDays && !fromDate) {
      const start = new Date();
      start.setDate(start.getDate() - input.lookbackDays);
      start.setHours(0, 0, 0, 0);
      fromDate = start;
    }

    const run = await this.runs.create({
      projectId: project.id,
      scheduleId: input.scheduleId ?? null,
      triggeredByUserId: input.actor?.id ?? null,
      trigger: input.trigger,
      branch: project.gitBranch,
      fromDate: fromDate ?? null,
      toDate: toDate ?? null,
      status: ScanRunStatus.RUNNING,
    });

    await this.runs.update(run.id, {
      status: ScanRunStatus.RUNNING,
      startedAt: new Date(),
    });

    try {
      const scanned = await this.scanner.scanRepository(project.localGitPath, {
        branch: project.gitBranch,
        fromDate,
        toDate,
        maxCount: input.maxCount,
      });

      const upserted = await this.commits.upsertMany(
        scanned.map((commit) => ({
          projectId: project.id,
          scanRunId: run.id,
          ...commit,
        })),
      );

      const completed =
        (await this.runs.update(run.id, {
          status: ScanRunStatus.COMPLETED,
          commitsScanned: scanned.length,
          commitsUpserted: upserted,
          finishedAt: new Date(),
          errorMessage: null,
        })) ?? run;

      logger.info(
        {
          projectId: project.id,
          runId: run.id,
          scanned: scanned.length,
          upserted,
        },
        'Git scan completed',
      );

      return {
        run: completed,
        commitsScanned: scanned.length,
        commitsUpserted: upserted,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Git scan failed';
      await this.runs.update(run.id, {
        status: ScanRunStatus.FAILED,
        errorMessage: message,
        finishedAt: new Date(),
      });
      throw error;
    }
  }
}

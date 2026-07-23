import type { IProjectRepository } from '../../../domain/repositories/IProjectRepository.js';
import type { IGitActivityRepository } from '../../../domain/repositories/IGitActivityRepository.js';
import type { GitActivity } from '../../../domain/entities/GitActivity.js';
import type { UserRole } from '../../../domain/entities/User.js';
import type { GitScannerService } from '../../../infrastructure/git/GitScannerService.js';
import { BadRequestError } from '../../../shared/errors/index.js';
import { getAccessibleProject } from '../../use-cases/projects/projectAccess.js';
import { logger } from '../../../infrastructure/logger/index.js';

export interface ScanProjectActivityInput {
  projectId: string;
  actor: { id: string; role: UserRole };
}

export interface ScanProjectActivityResult {
  projectId: string;
  repositoryName: string;
  branch: string;
  fromDate: Date;
  toDate: Date;
  commitsFound: number;
  activitiesStored: number;
  activities: GitActivity[];
}

/**
 * Scans today's git commits for a project and stores metadata in GitActivities.
 * Does not store full git diffs.
 */
export class ScanProjectActivityService {
  constructor(
    private readonly projects: IProjectRepository,
    private readonly activities: IGitActivityRepository,
    private readonly scanner: GitScannerService,
  ) {}

  async execute(input: ScanProjectActivityInput): Promise<ScanProjectActivityResult> {
    const project = await getAccessibleProject(
      this.projects,
      input.projectId,
      input.actor,
    );

    if (!project.isEnabled) {
      throw new BadRequestError('Project is disabled');
    }

    const { fromDate, toDate } = this.scanner.getTodayRange();

    const scanned = await this.scanner.scanActivityMetadata(project.localGitPath, {
      branch: project.gitBranch,
      fromDate,
      toDate,
    });

    const upserted = await this.activities.upsertMany(
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

    logger.info(
      {
        projectId: project.id,
        commitsFound: scanned.length,
        activitiesStored: upserted,
      },
      'Project activity scan completed',
    );

    return {
      projectId: project.id,
      repositoryName: project.name,
      branch: project.gitBranch,
      fromDate,
      toDate,
      commitsFound: scanned.length,
      activitiesStored: upserted,
      activities,
    };
  }
}

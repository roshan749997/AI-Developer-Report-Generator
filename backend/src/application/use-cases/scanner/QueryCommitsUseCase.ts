import type { IScannedCommitRepository } from '../../../domain/repositories/IScannedCommitRepository.js';
import type { IProjectRepository } from '../../../domain/repositories/IProjectRepository.js';
import type { IScanRunRepository } from '../../../domain/repositories/IScanRunRepository.js';
import type { CommitCategory, ScannedCommit } from '../../../domain/entities/ScannedCommit.js';
import type { ScanRun } from '../../../domain/entities/ScanRun.js';
import type { UserRole } from '../../../domain/entities/User.js';
import type { GitScannerService } from '../../../infrastructure/git/GitScannerService.js';
import { NotFoundError } from '../../../shared/errors/index.js';
import { getAccessibleProject } from '../projects/projectAccess.js';

export class ListProjectCommitsUseCase {
  constructor(
    private readonly projects: IProjectRepository,
    private readonly commits: IScannedCommitRepository,
    private readonly scanner: GitScannerService,
  ) {}

  async execute(
    projectId: string,
    actor: { id: string; role: UserRole },
    options: {
      range?: 'all' | 'today' | 'yesterday';
      category?: CommitCategory;
      authorEmail?: string;
      limit?: number;
      skip?: number;
    } = {},
  ): Promise<{ items: ScannedCommit[]; total: number }> {
    await getAccessibleProject(this.projects, projectId, actor);

    let fromDate: Date | undefined;
    let toDate: Date | undefined;

    if (options.range === 'today') {
      ({ fromDate, toDate } = this.scanner.getTodayRange());
    } else if (options.range === 'yesterday') {
      ({ fromDate, toDate } = this.scanner.getYesterdayRange());
    }

    const filter = {
      projectId,
      fromDate,
      toDate,
      category: options.category,
      authorEmail: options.authorEmail,
      limit: options.limit ?? 100,
      skip: options.skip ?? 0,
    };

    const [items, total] = await Promise.all([
      this.commits.list(filter),
      this.commits.count(filter),
    ]);

    return { items, total };
  }
}

export class GetProjectCommitUseCase {
  constructor(
    private readonly projects: IProjectRepository,
    private readonly commits: IScannedCommitRepository,
  ) {}

  async execute(
    projectId: string,
    commitHash: string,
    actor: { id: string; role: UserRole },
  ): Promise<ScannedCommit> {
    await getAccessibleProject(this.projects, projectId, actor);
    const commit = await this.commits.findByProjectAndHash(projectId, commitHash);
    if (!commit) {
      throw new NotFoundError('Commit not found');
    }
    return commit;
  }
}

export class ListScanRunsUseCase {
  constructor(
    private readonly projects: IProjectRepository,
    private readonly runs: IScanRunRepository,
  ) {}

  async execute(
    projectId: string,
    actor: { id: string; role: UserRole },
    limit = 50,
  ): Promise<ScanRun[]> {
    await getAccessibleProject(this.projects, projectId, actor);
    return this.runs.listByProject(projectId, limit);
  }
}

export class GetScanRunUseCase {
  constructor(
    private readonly projects: IProjectRepository,
    private readonly runs: IScanRunRepository,
  ) {}

  async execute(runId: string, actor: { id: string; role: UserRole }): Promise<ScanRun> {
    const run = await this.runs.findById(runId);
    if (!run) {
      throw new NotFoundError('Scan run not found');
    }
    await getAccessibleProject(this.projects, run.projectId, actor);
    return run;
  }
}

import type { IProjectRepository } from '../../../domain/repositories/IProjectRepository.js';
import type { IGitActivityRepository } from '../../../domain/repositories/IGitActivityRepository.js';
import type { UserRole } from '../../../domain/entities/User.js';
import type { GitScannerService } from '../../../infrastructure/git/GitScannerService.js';
import { canManageAllProjects } from '../../use-cases/projects/projectAccess.js';

export interface DashboardSummaryResult {
  todaysCommits: number;
  todaysChangedFiles: number;
  projectsScanned: number;
  latestScanTime: Date | null;
}

/**
 * Aggregates today's activity metrics across accessible projects.
 */
export class GetDashboardSummaryService {
  constructor(
    private readonly projects: IProjectRepository,
    private readonly activities: IGitActivityRepository,
    private readonly scanner: GitScannerService,
  ) {}

  async execute(actor: {
    id: string;
    role: UserRole;
  }): Promise<DashboardSummaryResult> {
    const projects = await this.projects.list(
      canManageAllProjects(actor.role) ? {} : { ownerId: actor.id },
    );

    const projectIds = projects.map((project) => project.id);
    const { fromDate, toDate } = this.scanner.getTodayRange();

    return this.activities.getDashboardSummary(projectIds, fromDate, toDate);
  }
}

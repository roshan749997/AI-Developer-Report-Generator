import type { IProjectRepository } from '../../../domain/repositories/IProjectRepository.js';
import type { IGitActivityRepository } from '../../../domain/repositories/IGitActivityRepository.js';
import type { GitActivity } from '../../../domain/entities/GitActivity.js';
import type { UserRole } from '../../../domain/entities/User.js';
import type { GitScannerService } from '../../../infrastructure/git/GitScannerService.js';
import { getAccessibleProject } from '../../use-cases/projects/projectAccess.js';

export interface GetProjectActivityResult {
  projectId: string;
  repositoryName: string;
  fromDate: Date;
  toDate: Date;
  total: number;
  activities: GitActivity[];
}

/**
 * Returns today's stored GitActivities for a project.
 */
export class GetProjectActivityService {
  constructor(
    private readonly projects: IProjectRepository,
    private readonly activities: IGitActivityRepository,
    private readonly scanner: GitScannerService,
  ) {}

  async execute(
    projectId: string,
    actor: { id: string; role: UserRole },
  ): Promise<GetProjectActivityResult> {
    const project = await getAccessibleProject(this.projects, projectId, actor);
    const { fromDate, toDate } = this.scanner.getTodayRange();

    const activities = await this.activities.listByProject({
      projectId: project.id,
      fromDate,
      toDate,
    });

    return {
      projectId: project.id,
      repositoryName: project.name,
      fromDate,
      toDate,
      total: activities.length,
      activities,
    };
  }
}

import type { IProjectRepository } from '../../../domain/repositories/IProjectRepository.js';
import type { Project } from '../../../domain/entities/Project.js';
import type { UserRole } from '../../../domain/entities/User.js';
import type { ListProjectsQueryDto } from '../../dto/project.dto.js';
import { canManageAllProjects } from './projectAccess.js';
import { getAccessibleProject } from './projectAccess.js';

export class ListProjectsUseCase {
  constructor(private readonly projects: IProjectRepository) {}

  async execute(
    actor: { id: string; role: UserRole },
    query: ListProjectsQueryDto,
  ): Promise<Project[]> {
    const mineOnly = query.mine === true || !canManageAllProjects(actor.role);

    return this.projects.list({
      ownerId: mineOnly ? actor.id : undefined,
      isEnabled: query.isEnabled,
      search: query.search,
    });
  }
}

export class GetProjectUseCase {
  constructor(private readonly projects: IProjectRepository) {}

  async execute(projectId: string, actor: { id: string; role: UserRole }): Promise<Project> {
    return getAccessibleProject(this.projects, projectId, actor);
  }
}

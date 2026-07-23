import type { IProjectRepository } from '../../../domain/repositories/IProjectRepository.js';
import type { Project } from '../../../domain/entities/Project.js';
import type { UserRole } from '../../../domain/entities/User.js';
import { BadRequestError } from '../../../shared/errors/index.js';
import { getAccessibleProject } from './projectAccess.js';

export class SetProjectEnabledUseCase {
  constructor(private readonly projects: IProjectRepository) {}

  async execute(
    projectId: string,
    actor: { id: string; role: UserRole },
    isEnabled: boolean,
  ): Promise<Project> {
    const project = await getAccessibleProject(this.projects, projectId, actor);

    if (project.isEnabled === isEnabled) {
      throw new BadRequestError(
        isEnabled ? 'Project is already enabled' : 'Project is already disabled',
      );
    }

    const updated = await this.projects.setEnabled(projectId, isEnabled);
    return updated ?? { ...project, isEnabled };
  }
}

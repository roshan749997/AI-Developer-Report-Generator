import type { IProjectRepository } from '../../../domain/repositories/IProjectRepository.js';
import type { UserRole } from '../../../domain/entities/User.js';
import { NotFoundError } from '../../../shared/errors/index.js';
import { getAccessibleProject } from './projectAccess.js';

export class DeleteProjectUseCase {
  constructor(private readonly projects: IProjectRepository) {}

  async execute(projectId: string, actor: { id: string; role: UserRole }): Promise<void> {
    await getAccessibleProject(this.projects, projectId, actor);
    const deleted = await this.projects.delete(projectId);
    if (!deleted) {
      throw new NotFoundError('Project not found');
    }
  }
}

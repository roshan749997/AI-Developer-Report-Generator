import type { UserRole } from '../../../domain/entities/User.js';
import { UserRole as Roles } from '../../../domain/entities/User.js';
import type { Project } from '../../../domain/entities/Project.js';
import { ForbiddenError, NotFoundError } from '../../../shared/errors/index.js';
import type { IProjectRepository } from '../../../domain/repositories/IProjectRepository.js';

export async function getAccessibleProject(
  projects: IProjectRepository,
  projectId: string,
  actor: { id: string; role: UserRole },
): Promise<Project> {
  const project = await projects.findById(projectId);
  if (!project) {
    throw new NotFoundError('Project not found');
  }

  const isPrivileged = actor.role === Roles.ADMIN || actor.role === Roles.MANAGER;
  if (!isPrivileged && project.ownerId !== actor.id) {
    throw new ForbiddenError('You do not have access to this project');
  }

  return project;
}

export function canManageAllProjects(role: UserRole): boolean {
  return role === Roles.ADMIN || role === Roles.MANAGER;
}

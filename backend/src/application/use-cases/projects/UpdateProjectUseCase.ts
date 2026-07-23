import type { IProjectRepository } from '../../../domain/repositories/IProjectRepository.js';
import type { Project } from '../../../domain/entities/Project.js';
import type { UserRole } from '../../../domain/entities/User.js';
import type { GitService } from '../../../infrastructure/git/GitService.js';
import { ConflictError } from '../../../shared/errors/index.js';
import type { UpdateProjectDto } from '../../dto/project.dto.js';
import { getAccessibleProject } from './projectAccess.js';

export class UpdateProjectUseCase {
  constructor(
    private readonly projects: IProjectRepository,
    private readonly git: GitService,
  ) {}

  async execute(
    projectId: string,
    actor: { id: string; role: UserRole },
    input: UpdateProjectDto,
  ): Promise<Project> {
    const project = await getAccessibleProject(this.projects, projectId, actor);

    if (input.name && input.name !== project.name) {
      const existing = await this.projects.findByOwnerAndName(project.ownerId, input.name);
      if (existing && existing.id !== project.id) {
        throw new ConflictError('A project with this name already exists');
      }
    }

    const nextPath = input.localGitPath ?? project.localGitPath;
    const nextBranch = input.gitBranch ?? project.gitBranch;
    const pathOrBranchChanged =
      (input.localGitPath !== undefined && input.localGitPath !== project.localGitPath) ||
      (input.gitBranch !== undefined && input.gitBranch !== project.gitBranch);

    let localGitPath = nextPath;
    if (input.validateGit !== false && pathOrBranchChanged) {
      const validation = await this.git.validateRepository(nextPath, nextBranch);
      localGitPath = validation.localGitPath;
    }

    const updated = await this.projects.update(projectId, {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.localGitPath !== undefined || pathOrBranchChanged
        ? { localGitPath }
        : {}),
      ...(input.gitBranch !== undefined ? { gitBranch: input.gitBranch.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description.trim() } : {}),
      ...(input.tags !== undefined
        ? { tags: input.tags.map((tag) => tag.trim()).filter(Boolean) }
        : {}),
    });

    return updated ?? project;
  }
}

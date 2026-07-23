import type { IProjectRepository } from '../../../domain/repositories/IProjectRepository.js';
import type { Project } from '../../../domain/entities/Project.js';
import type { GitService } from '../../../infrastructure/git/GitService.js';
import { ConflictError } from '../../../shared/errors/index.js';
import type { CreateProjectDto } from '../../dto/project.dto.js';

export class CreateProjectUseCase {
  constructor(
    private readonly projects: IProjectRepository,
    private readonly git: GitService,
  ) {}

  async execute(ownerId: string, input: CreateProjectDto): Promise<Project> {
    const existing = await this.projects.findByOwnerAndName(ownerId, input.name);
    if (existing) {
      throw new ConflictError('A project with this name already exists');
    }

    const shouldValidate = input.validateGit !== false;
    let localGitPath = input.localGitPath;

    if (shouldValidate) {
      const validation = await this.git.validateRepository(input.localGitPath, input.gitBranch);
      localGitPath = validation.localGitPath;
    }

    return this.projects.create({
      name: input.name.trim(),
      localGitPath,
      gitBranch: input.gitBranch.trim(),
      description: input.description?.trim() ?? '',
      tags: (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
      ownerId,
      isEnabled: true,
    });
  }
}

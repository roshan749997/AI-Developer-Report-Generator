import type { IProjectRepository } from '../../../domain/repositories/IProjectRepository.js';
import type { UserRole } from '../../../domain/entities/User.js';
import type { GitService } from '../../../infrastructure/git/GitService.js';
import type { TestConnectionDto } from '../../dto/project.dto.js';
import { getAccessibleProject } from './projectAccess.js';

export class TestGitConnectionUseCase {
  constructor(
    private readonly projects: IProjectRepository,
    private readonly git: GitService,
  ) {}

  async executeWithPayload(input: TestConnectionDto) {
    return this.git.testConnection(input.localGitPath, input.gitBranch);
  }

  async executeForProject(projectId: string, actor: { id: string; role: UserRole }) {
    const project = await getAccessibleProject(this.projects, projectId, actor);
    const result = await this.git.testConnection(project.localGitPath, project.gitBranch);

    await this.projects.updateConnectionMeta(project.id, {
      lastValidatedAt: new Date(),
      lastConnectionStatus: result.success ? 'success' : 'failed',
      lastConnectionMessage: result.message,
    });

    return {
      projectId: project.id,
      ...result,
    };
  }
}

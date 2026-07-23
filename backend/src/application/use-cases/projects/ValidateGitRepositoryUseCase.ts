import type { GitService } from '../../../infrastructure/git/GitService.js';
import type { ValidateGitDto } from '../../dto/project.dto.js';

export class ValidateGitRepositoryUseCase {
  constructor(private readonly git: GitService) {}

  async execute(input: ValidateGitDto) {
    return this.git.validateRepository(input.localGitPath, input.gitBranch);
  }
}

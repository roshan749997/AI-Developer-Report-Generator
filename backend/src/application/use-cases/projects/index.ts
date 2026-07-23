import { projectRepository } from '../../../infrastructure/database/repositories/MongoProjectRepository.js';
import { gitService } from '../../../infrastructure/git/index.js';
import { CreateProjectUseCase } from './CreateProjectUseCase.js';
import { UpdateProjectUseCase } from './UpdateProjectUseCase.js';
import { DeleteProjectUseCase } from './DeleteProjectUseCase.js';
import { SetProjectEnabledUseCase } from './SetProjectEnabledUseCase.js';
import { GetProjectUseCase, ListProjectsUseCase } from './GetProjectsUseCase.js';
import { ValidateGitRepositoryUseCase } from './ValidateGitRepositoryUseCase.js';
import { TestGitConnectionUseCase } from './TestGitConnectionUseCase.js';

export const createProjectUseCase = new CreateProjectUseCase(projectRepository, gitService);
export const updateProjectUseCase = new UpdateProjectUseCase(projectRepository, gitService);
export const deleteProjectUseCase = new DeleteProjectUseCase(projectRepository);
export const setProjectEnabledUseCase = new SetProjectEnabledUseCase(projectRepository);
export const listProjectsUseCase = new ListProjectsUseCase(projectRepository);
export const getProjectUseCase = new GetProjectUseCase(projectRepository);
export const validateGitRepositoryUseCase = new ValidateGitRepositoryUseCase(gitService);
export const testGitConnectionUseCase = new TestGitConnectionUseCase(
  projectRepository,
  gitService,
);

export {
  CreateProjectUseCase,
  UpdateProjectUseCase,
  DeleteProjectUseCase,
  SetProjectEnabledUseCase,
  ListProjectsUseCase,
  GetProjectUseCase,
  ValidateGitRepositoryUseCase,
  TestGitConnectionUseCase,
};

import type { Request, Response } from 'express';
import {
  createProjectUseCase,
  updateProjectUseCase,
  deleteProjectUseCase,
  setProjectEnabledUseCase,
  listProjectsUseCase,
  getProjectUseCase,
  validateGitRepositoryUseCase,
  testGitConnectionUseCase,
} from '../../../application/use-cases/projects/index.js';
import type {
  CreateProjectDto,
  ListProjectsQueryDto,
  TestConnectionDto,
  UpdateProjectDto,
  ValidateGitDto,
} from '../../../application/dto/project.dto.js';
import { HttpStatus } from '../../../shared/constants/httpStatus.js';
import { UnauthorizedError } from '../../../shared/errors/index.js';
import { ApiResponse } from '../response/index.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  return req.user;
}

export class ProjectController {
  create = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const project = await createProjectUseCase.execute(user.id, req.body as CreateProjectDto);
    return ApiResponse.created(res, project, 'Project created');
  };

  list = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const projects = await listProjectsUseCase.execute(user, req.query as ListProjectsQueryDto);
    return ApiResponse.success(res, projects, 'Projects retrieved');
  };

  getById = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const project = await getProjectUseCase.execute(req.params.id!, user);
    return ApiResponse.success(res, project, 'Project retrieved');
  };

  update = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const project = await updateProjectUseCase.execute(
      req.params.id!,
      user,
      req.body as UpdateProjectDto,
    );
    return ApiResponse.success(res, project, 'Project updated');
  };

  remove = async (req: Request, res: Response) => {
    const user = requireUser(req);
    await deleteProjectUseCase.execute(req.params.id!, user);
    return ApiResponse.success(res, null, 'Project deleted', HttpStatus.OK);
  };

  enable = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const project = await setProjectEnabledUseCase.execute(req.params.id!, user, true);
    return ApiResponse.success(res, project, 'Project enabled');
  };

  disable = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const project = await setProjectEnabledUseCase.execute(req.params.id!, user, false);
    return ApiResponse.success(res, project, 'Project disabled');
  };

  validateGit = async (req: Request, res: Response) => {
    requireUser(req);
    const result = await validateGitRepositoryUseCase.execute(req.body as ValidateGitDto);
    return ApiResponse.success(res, result, result.message);
  };

  testConnection = async (req: Request, res: Response) => {
    requireUser(req);
    const result = await testGitConnectionUseCase.executeWithPayload(
      req.body as TestConnectionDto,
    );
    return ApiResponse.success(res, result, result.message);
  };

  testProjectConnection = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const result = await testGitConnectionUseCase.executeForProject(req.params.id!, user);
    return ApiResponse.success(res, result, result.message);
  };
}

export const projectController = new ProjectController();

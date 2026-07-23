import type { Project } from '../entities/Project.js';

export interface CreateProjectInput {
  name: string;
  localGitPath: string;
  gitBranch: string;
  description: string;
  tags: string[];
  ownerId: string;
  isEnabled?: boolean;
}

export interface UpdateProjectInput {
  name?: string;
  localGitPath?: string;
  gitBranch?: string;
  description?: string;
  tags?: string[];
}

export interface ProjectConnectionMeta {
  lastValidatedAt: Date;
  lastConnectionStatus: 'success' | 'failed';
  lastConnectionMessage: string;
}

export interface ListProjectsFilter {
  ownerId?: string;
  isEnabled?: boolean;
  search?: string;
}

export interface IProjectRepository {
  create(input: CreateProjectInput): Promise<Project>;
  findById(id: string): Promise<Project | null>;
  findByOwnerAndName(ownerId: string, name: string): Promise<Project | null>;
  list(filter: ListProjectsFilter): Promise<Project[]>;
  update(id: string, input: UpdateProjectInput): Promise<Project | null>;
  setEnabled(id: string, isEnabled: boolean): Promise<Project | null>;
  updateConnectionMeta(id: string, meta: ProjectConnectionMeta): Promise<Project | null>;
  delete(id: string): Promise<boolean>;
}

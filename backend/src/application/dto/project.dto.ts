export interface CreateProjectDto {
  name: string;
  localGitPath: string;
  gitBranch: string;
  description?: string;
  tags?: string[];
  validateGit?: boolean;
}

export interface UpdateProjectDto {
  name?: string;
  localGitPath?: string;
  gitBranch?: string;
  description?: string;
  tags?: string[];
  validateGit?: boolean;
}

export interface ValidateGitDto {
  localGitPath: string;
  gitBranch: string;
}

export interface TestConnectionDto {
  localGitPath: string;
  gitBranch: string;
}

export interface ListProjectsQueryDto {
  isEnabled?: boolean;
  search?: string;
  mine?: boolean;
}

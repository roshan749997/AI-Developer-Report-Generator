export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiFailure {
  success: false;
  message: string;
  code: string;
  details?: unknown;
  path?: string;
  timestamp: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: 'developer' | 'manager' | 'admin';
  organizationId?: string | null;
  avatarUrl?: string | null;
  timezone?: string;
  workingHours?: { start: string; end: string };
  gitUsername?: string | null;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: PublicUser;
  tokens: AuthTokens;
}

export interface Project {
  id: string;
  name: string;
  localGitPath: string;
  gitBranch: string;
  description: string;
  tags: string[];
  isEnabled: boolean;
  ownerId: string;
  lastValidatedAt?: string | null;
  lastConnectionStatus?: 'success' | 'failed' | null;
  lastConnectionMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  name: string;
  localGitPath: string;
  gitBranch: string;
  description?: string;
  tags?: string[];
  validateGit?: boolean;
}

export interface UpdateProjectPayload {
  name?: string;
  localGitPath?: string;
  gitBranch?: string;
  description?: string;
  tags?: string[];
  validateGit?: boolean;
}

export interface GitActivity {
  id: string;
  projectId: string;
  repositoryName: string;
  branch: string;
  commitHash: string;
  commitMessage: string;
  author: string;
  commitDate: string;
  changedFiles: string[];
  insertions: number;
  deletions: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectActivityResult {
  projectId: string;
  repositoryName: string;
  fromDate: string;
  toDate: string;
  total: number;
  activities: GitActivity[];
}

export interface ScanActivityResult {
  projectId: string;
  repositoryName: string;
  branch: string;
  fromDate: string;
  toDate: string;
  commitsFound: number;
  activitiesStored: number;
  activities: GitActivity[];
}

export interface DashboardSummary {
  todaysCommits: number;
  todaysChangedFiles: number;
  projectsScanned: number;
  latestScanTime: string | null;
}

export interface DailyReport {
  id: string;
  projectId: string;
  reportDate: string;
  completedTasks: string[];
  workInProgress: string[];
  pendingTasks: string[];
  challenges: string[];
  tomorrowPlan: string[];
  summary: string;
  rawAIResponse: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportListItem extends DailyReport {
  projectName?: string;
}

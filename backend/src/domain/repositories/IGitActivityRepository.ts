import type { GitActivity } from '../entities/GitActivity.js';

export interface UpsertGitActivityInput {
  projectId: string;
  repositoryName: string;
  branch: string;
  commitHash: string;
  commitMessage: string;
  author: string;
  commitDate: Date;
  changedFiles: string[];
  insertions: number;
  deletions: number;
}

export interface ListGitActivityFilter {
  projectId?: string;
  projectIds?: string[];
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
}

export interface DashboardActivitySummary {
  todaysCommits: number;
  todaysChangedFiles: number;
  projectsScanned: number;
  latestScanTime: Date | null;
}

export interface IGitActivityRepository {
  upsertMany(activities: UpsertGitActivityInput[]): Promise<number>;
  listByProject(filter: ListGitActivityFilter): Promise<GitActivity[]>;
  countByFilter(filter: ListGitActivityFilter): Promise<number>;
  getDashboardSummary(
    projectIds: string[],
    fromDate: Date,
    toDate: Date,
  ): Promise<DashboardActivitySummary>;
}

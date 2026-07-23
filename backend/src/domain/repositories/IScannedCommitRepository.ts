import type { CommitCategory, ScannedCommit } from '../entities/ScannedCommit.js';

export interface UpsertScannedCommitInput {
  projectId: string;
  scanRunId: string;
  commitHash: string;
  shortHash: string;
  authorName: string;
  authorEmail: string;
  authoredAt: Date;
  branch: string;
  commitMessage: string;
  changedFiles: string[];
  renamedFiles: string[];
  deletedFiles: string[];
  insertions: number;
  deletions: number;
  gitDiff: string;
  gitDiffTruncated: boolean;
  categories: CommitCategory[];
}

export interface ListCommitsFilter {
  projectId: string;
  fromDate?: Date;
  toDate?: Date;
  authorEmail?: string;
  category?: CommitCategory;
  branch?: string;
  limit?: number;
  skip?: number;
}

export interface IScannedCommitRepository {
  upsertMany(commits: UpsertScannedCommitInput[]): Promise<number>;
  findByProjectAndHash(projectId: string, commitHash: string): Promise<ScannedCommit | null>;
  list(filter: ListCommitsFilter): Promise<ScannedCommit[]>;
  count(filter: Omit<ListCommitsFilter, 'limit' | 'skip'>): Promise<number>;
  deleteByProject(projectId: string): Promise<number>;
}

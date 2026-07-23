export const CommitCategory = {
  BUG_FIX: 'bug_fix',
  FEATURE: 'feature',
  REFACTOR: 'refactor',
  UI: 'ui',
  BACKEND: 'backend',
  API: 'api',
  FIREBASE: 'firebase',
  AUTHENTICATION: 'authentication',
  PERFORMANCE: 'performance',
} as const;

export type CommitCategory = (typeof CommitCategory)[keyof typeof CommitCategory];

export const COMMIT_CATEGORIES = Object.values(CommitCategory);

export interface ScannedCommit {
  id: string;
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
  createdAt: Date;
  updatedAt: Date;
}

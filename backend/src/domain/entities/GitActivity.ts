/**
 * Lightweight git activity metadata stored in the GitActivities collection.
 * Full git diffs are intentionally excluded.
 */
export interface GitActivity {
  id: string;
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
  createdAt: Date;
  updatedAt: Date;
}

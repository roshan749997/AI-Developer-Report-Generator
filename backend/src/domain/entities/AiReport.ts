export interface AiReportContent {
  tasksCompleted: string[];
  workInProgress: string[];
  pendingTasks: string[];
  challenges: string[];
  tomorrowPlan: string[];
  summary: string;
  importantNotes: string[];
}

export interface AiReportCommitSnapshot {
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
  categories: string[];
  gitDiffExcerpt: string;
}

export interface AiReportPreviousSnapshot {
  reportId: string;
  reportDate: Date;
  summary: string;
  tasksCompleted: string[];
  workInProgress: string[];
  pendingTasks: string[];
  tomorrowPlan: string[];
}

export const AiReportStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type AiReportStatus = (typeof AiReportStatus)[keyof typeof AiReportStatus];

export interface AiReport {
  id: string;
  projectId: string;
  projectName: string;
  generatedByUserId: string;
  status: AiReportStatus;
  reportDate: Date;
  fromDate: Date;
  toDate: Date;
  model: string;
  openaiResponseId?: string | null;
  content: AiReportContent;
  inputCommits: AiReportCommitSnapshot[];
  previousReports: AiReportPreviousSnapshot[];
  promptVersion: string;
  rawOutput?: string | null;
  errorMessage?: string | null;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

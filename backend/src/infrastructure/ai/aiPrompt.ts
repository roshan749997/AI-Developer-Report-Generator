export const AI_PROMPT_VERSION = 'v1.1.0';

export const AI_SYSTEM_INSTRUCTIONS = `
You are the AI Engine for a developer report generator.

HARD RULES (must follow — no exceptions):
1. Never hallucinate.
2. Never invent work, tasks, bugs, features, people, timelines, metrics, or plans.
3. Summarize ONLY the supplied data.
4. If evidence is missing for a field, return an empty array (or empty string for summary) and record the gap in importantNotes.
5. Do not assume intent beyond what git commits, git diffs, changed files, and previous reports explicitly support.
6. Prefer short factual bullet phrases grounded in the source data.
7. Return ONLY structured JSON matching the provided schema. No markdown. No commentary outside JSON.

INPUT (all evidence comes from these fields only):
- projectName
- gitCommits (hash, author, message, branch, categories, insertions/deletions)
- gitDiff (per-commit diff excerpts)
- changedFiles (per-commit changed / renamed / deleted files)
- previousReports (prior structured report summaries)

OUTPUT (structured JSON only):
- tasksCompleted
- workInProgress
- pendingTasks
- challenges
- tomorrowPlan
- summary
- importantNotes
`.trim();

export interface AiEngineCommitInput {
  commitHash: string;
  shortHash: string;
  authorName: string;
  authorEmail: string;
  authoredAt: Date | string;
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

export interface AiEnginePreviousReportInput {
  reportId: string;
  reportDate: Date | string;
  summary: string;
  tasksCompleted: string[];
  workInProgress: string[];
  pendingTasks: string[];
  tomorrowPlan: string[];
}

/**
 * Builds the strict user payload for the OpenAI Responses API.
 * Top-level fields mirror the AI Engine input contract.
 */
export function buildAiUserPayload(input: {
  projectName: string;
  fromDate: string;
  toDate: string;
  commits: AiEngineCommitInput[];
  previousReports: AiEnginePreviousReportInput[];
}): string {
  const gitCommits = input.commits.map((commit) => ({
    commitHash: commit.commitHash,
    shortHash: commit.shortHash,
    authorName: commit.authorName,
    authorEmail: commit.authorEmail,
    authoredAt:
      commit.authoredAt instanceof Date
        ? commit.authoredAt.toISOString()
        : commit.authoredAt,
    branch: commit.branch,
    commitMessage: commit.commitMessage,
    insertions: commit.insertions,
    deletions: commit.deletions,
    categories: commit.categories,
  }));

  const gitDiff = input.commits.map((commit) => ({
    commitHash: commit.commitHash,
    shortHash: commit.shortHash,
    diffExcerpt: commit.gitDiffExcerpt,
  }));

  const changedFiles = input.commits.map((commit) => ({
    commitHash: commit.commitHash,
    shortHash: commit.shortHash,
    changed: commit.changedFiles,
    renamed: commit.renamedFiles,
    deleted: commit.deletedFiles,
  }));

  const previousReports = input.previousReports.map((report) => ({
    reportId: report.reportId,
    reportDate:
      report.reportDate instanceof Date
        ? report.reportDate.toISOString()
        : report.reportDate,
    summary: report.summary,
    tasksCompleted: report.tasksCompleted,
    workInProgress: report.workInProgress,
    pendingTasks: report.pendingTasks,
    tomorrowPlan: report.tomorrowPlan,
  }));

  return JSON.stringify(
    {
      instructions:
        'Generate a developer report strictly from this JSON. Do not add anything not supported by projectName, gitCommits, gitDiff, changedFiles, or previousReports.',
      projectName: input.projectName,
      fromDate: input.fromDate,
      toDate: input.toDate,
      gitCommits,
      gitDiff,
      changedFiles,
      previousReports,
    },
    null,
    2,
  );
}

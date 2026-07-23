import type { GitActivity } from '../../domain/entities/GitActivity.js';

export function groupActivitiesByAuthor(activities: GitActivity[]) {
  const groups = new Map<
    string,
    Array<{
      commitHash: string;
      commitMessage: string;
      commitDate: string;
      branch: string;
      changedFiles: string[];
      insertions: number;
      deletions: number;
    }>
  >();

  for (const activity of activities) {
    const list = groups.get(activity.author) ?? [];
    list.push({
      commitHash: activity.commitHash,
      commitMessage: activity.commitMessage,
      commitDate: activity.commitDate.toISOString(),
      branch: activity.branch,
      changedFiles: activity.changedFiles,
      insertions: activity.insertions,
      deletions: activity.deletions,
    });
    groups.set(activity.author, list);
  }

  return Array.from(groups.entries()).map(([author, commits]) => ({
    author,
    commitCount: commits.length,
    commits,
  }));
}

/**
 * Builds a strict Gemini prompt from today's GitActivities.
 */
export function buildDailyReportPrompt(input: {
  projectName: string;
  reportDate: string;
  activities: GitActivity[];
}): string {
  const grouped = groupActivitiesByAuthor(input.activities);

  const payload = {
    projectName: input.projectName,
    reportDate: input.reportDate,
    totalCommits: input.activities.length,
    activitiesByAuthor: grouped,
    activities: input.activities.map((activity) => ({
      commitHash: activity.commitHash,
      commitMessage: activity.commitMessage,
      author: activity.author,
      commitDate: activity.commitDate.toISOString(),
      branch: activity.branch,
      changedFiles: activity.changedFiles,
      insertions: activity.insertions,
      deletions: activity.deletions,
      repositoryName: activity.repositoryName,
    })),
  };

  return `
You are an experienced Software Engineering Manager.

Generate a professional daily work report.

Use ONLY the supplied Git activities.
Never invent tasks.
If information is missing, leave the section empty.
Return ONLY valid JSON.

JSON Format
{
  "completedTasks": [],
  "workInProgress": [],
  "pendingTasks": [],
  "challenges": [],
  "tomorrowPlan": [],
  "summary": ""
}

Git activities (source of truth):
${JSON.stringify(payload, null, 2)}
`.trim();
}

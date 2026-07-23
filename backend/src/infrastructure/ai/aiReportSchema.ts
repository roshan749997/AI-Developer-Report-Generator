import { z } from 'zod';

/**
 * Strict structured output schema for AI developer reports.
 * All fields required (OpenAI structured outputs requirement).
 */
export const aiReportContentSchema = z.object({
  tasksCompleted: z.array(z.string()),
  workInProgress: z.array(z.string()),
  pendingTasks: z.array(z.string()),
  challenges: z.array(z.string()),
  tomorrowPlan: z.array(z.string()),
  summary: z.string(),
  importantNotes: z.array(z.string()),
});

export type AiReportContentDto = z.infer<typeof aiReportContentSchema>;

export const AI_REPORT_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'tasksCompleted',
    'workInProgress',
    'pendingTasks',
    'challenges',
    'tomorrowPlan',
    'summary',
    'importantNotes',
  ],
  properties: {
    tasksCompleted: {
      type: 'array',
      items: { type: 'string' },
      description:
        'Tasks completed — only items explicitly evidenced by gitCommits, gitDiff, or changedFiles. Never invent.',
    },
    workInProgress: {
      type: 'array',
      items: { type: 'string' },
      description:
        'Work in progress — only if clearly evidenced by supplied data. Empty array if unknown.',
    },
    pendingTasks: {
      type: 'array',
      items: { type: 'string' },
      description:
        'Pending tasks — only if evidenced by supplied data or previousReports. Empty array if unknown.',
    },
    challenges: {
      type: 'array',
      items: { type: 'string' },
      description:
        'Challenges — only if evidenced (e.g. bug fixes, reverts). Empty array if none evidenced.',
    },
    tomorrowPlan: {
      type: 'array',
      items: { type: 'string' },
      description:
        'Tomorrow plan — only if supported by pending/WIP items in supplied data. Never invent.',
    },
    summary: {
      type: 'string',
      description:
        'Concise factual summary of supplied activity only. Empty string if no evidence.',
    },
    importantNotes: {
      type: 'array',
      items: { type: 'string' },
      description:
        'Gaps, caveats, and notes when evidence is insufficient. Use when fields are empty due to missing data.',
    },
  },
} as const;

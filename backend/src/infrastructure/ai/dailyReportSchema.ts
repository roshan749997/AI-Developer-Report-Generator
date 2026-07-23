import { z } from 'zod';
import type { DailyReportContent } from '../../domain/entities/DailyReport.js';

export const dailyReportContentSchema = z.object({
  completedTasks: z.array(z.string()),
  workInProgress: z.array(z.string()),
  pendingTasks: z.array(z.string()),
  challenges: z.array(z.string()),
  tomorrowPlan: z.array(z.string()),
  summary: z.string(),
});

export function parseDailyReportContent(raw: unknown): DailyReportContent {
  return dailyReportContentSchema.parse(raw);
}

export const EMPTY_DAILY_REPORT_CONTENT: DailyReportContent = {
  completedTasks: [],
  workInProgress: [],
  pendingTasks: [],
  challenges: [],
  tomorrowPlan: [],
  summary: '',
};

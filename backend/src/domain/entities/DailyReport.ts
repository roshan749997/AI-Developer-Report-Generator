/**
 * Daily work report generated from today's GitActivities via Gemini.
 * Stored in the Reports collection.
 */
export interface DailyReport {
  id: string;
  projectId: string;
  reportDate: Date;
  completedTasks: string[];
  workInProgress: string[];
  pendingTasks: string[];
  challenges: string[];
  tomorrowPlan: string[];
  summary: string;
  rawAIResponse: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyReportContent {
  completedTasks: string[];
  workInProgress: string[];
  pendingTasks: string[];
  challenges: string[];
  tomorrowPlan: string[];
  summary: string;
}

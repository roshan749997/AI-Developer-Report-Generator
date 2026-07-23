import type { DailyReport, DailyReportContent } from '../entities/DailyReport.js';

export interface CreateDailyReportInput extends DailyReportContent {
  projectId: string;
  reportDate: Date;
  rawAIResponse: string;
}

export interface IDailyReportRepository {
  create(input: CreateDailyReportInput): Promise<DailyReport>;
  findById(id: string): Promise<DailyReport | null>;
  findByProjectAndDate(
    projectId: string,
    reportDate: Date,
  ): Promise<DailyReport | null>;
  listByProject(projectId: string, limit?: number): Promise<DailyReport[]>;
}

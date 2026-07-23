import type {
  AiReport,
  AiReportCommitSnapshot,
  AiReportContent,
  AiReportPreviousSnapshot,
  AiReportStatus,
} from '../entities/AiReport.js';

export interface CreateAiReportInput {
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
}

export interface IAiReportRepository {
  create(input: CreateAiReportInput): Promise<AiReport>;
  findById(id: string): Promise<AiReport | null>;
  listByProject(projectId: string, limit?: number): Promise<AiReport[]>;
  listPreviousSummaries(projectId: string, limit: number): Promise<AiReport[]>;
}

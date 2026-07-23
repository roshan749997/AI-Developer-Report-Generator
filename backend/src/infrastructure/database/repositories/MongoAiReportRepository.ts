import { Types } from 'mongoose';
import type {
  CreateAiReportInput,
  IAiReportRepository,
} from '../../../domain/repositories/IAiReportRepository.js';
import type { AiReport } from '../../../domain/entities/AiReport.js';
import { AiReportModel, type AiReportDocument } from '../models/AiReportModel.js';

function mapReport(doc: AiReportDocument): AiReport {
  return {
    id: doc._id.toString(),
    projectId: doc.projectId.toString(),
    projectName: doc.projectName,
    generatedByUserId: doc.generatedByUserId.toString(),
    status: doc.status as AiReport['status'],
    reportDate: doc.reportDate,
    fromDate: doc.fromDate,
    toDate: doc.toDate,
    model: doc.modelName,
    openaiResponseId: doc.openaiResponseId ?? null,
    content: {
      tasksCompleted: doc.content?.tasksCompleted ?? [],
      workInProgress: doc.content?.workInProgress ?? [],
      pendingTasks: doc.content?.pendingTasks ?? [],
      challenges: doc.content?.challenges ?? [],
      tomorrowPlan: doc.content?.tomorrowPlan ?? [],
      summary: doc.content?.summary ?? '',
      importantNotes: doc.content?.importantNotes ?? [],
    },
    inputCommits: (doc.inputCommits ?? []).map((commit) => ({
      commitHash: String(commit.commitHash ?? ''),
      shortHash: String(commit.shortHash ?? ''),
      authorName: String(commit.authorName ?? ''),
      authorEmail: String(commit.authorEmail ?? ''),
      authoredAt: new Date(String(commit.authoredAt)),
      branch: String(commit.branch ?? ''),
      commitMessage: String(commit.commitMessage ?? ''),
      changedFiles: (commit.changedFiles as string[]) ?? [],
      renamedFiles: (commit.renamedFiles as string[]) ?? [],
      deletedFiles: (commit.deletedFiles as string[]) ?? [],
      insertions: Number(commit.insertions ?? 0),
      deletions: Number(commit.deletions ?? 0),
      categories: (commit.categories as string[]) ?? [],
      gitDiffExcerpt: String(commit.gitDiffExcerpt ?? ''),
    })),
    previousReports: (doc.previousReports ?? []).map((report) => ({
      reportId: String(report.reportId ?? ''),
      reportDate: new Date(String(report.reportDate)),
      summary: String(report.summary ?? ''),
      tasksCompleted: (report.tasksCompleted as string[]) ?? [],
      workInProgress: (report.workInProgress as string[]) ?? [],
      pendingTasks: (report.pendingTasks as string[]) ?? [],
      tomorrowPlan: (report.tomorrowPlan as string[]) ?? [],
    })),
    promptVersion: doc.promptVersion,
    rawOutput: doc.rawOutput ?? null,
    errorMessage: doc.errorMessage ?? null,
    usage: doc.usage
      ? {
          inputTokens: doc.usage.inputTokens,
          outputTokens: doc.usage.outputTokens,
          totalTokens: doc.usage.totalTokens,
        }
      : null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongoAiReportRepository implements IAiReportRepository {
  async create(input: CreateAiReportInput): Promise<AiReport> {
    const created = await AiReportModel.create({
      projectId: input.projectId,
      projectName: input.projectName,
      generatedByUserId: input.generatedByUserId,
      status: input.status,
      reportDate: input.reportDate,
      fromDate: input.fromDate,
      toDate: input.toDate,
      modelName: input.model,
      openaiResponseId: input.openaiResponseId ?? null,
      content: input.content,
      inputCommits: input.inputCommits,
      previousReports: input.previousReports,
      promptVersion: input.promptVersion,
      rawOutput: input.rawOutput ?? null,
      errorMessage: input.errorMessage ?? null,
      usage: input.usage ?? null,
    });
    return mapReport(created);
  }

  async findById(id: string): Promise<AiReport | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await AiReportModel.findById(id).exec();
    return doc ? mapReport(doc) : null;
  }

  async listByProject(projectId: string, limit = 50): Promise<AiReport[]> {
    const docs = await AiReportModel.find({ projectId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
    return docs.map(mapReport);
  }

  async listPreviousSummaries(projectId: string, limit: number): Promise<AiReport[]> {
    const docs = await AiReportModel.find({
      projectId,
      status: 'completed',
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
    return docs.map(mapReport);
  }
}

export const aiReportRepository = new MongoAiReportRepository();

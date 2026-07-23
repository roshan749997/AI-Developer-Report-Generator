import { Types } from 'mongoose';
import type {
  CreateDailyReportInput,
  IDailyReportRepository,
} from '../../../domain/repositories/IDailyReportRepository.js';
import type { DailyReport } from '../../../domain/entities/DailyReport.js';
import {
  DailyReportModel,
  type DailyReportDocument,
} from '../models/DailyReportModel.js';

function startOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function mapReport(doc: DailyReportDocument): DailyReport {
  return {
    id: doc._id.toString(),
    projectId: doc.projectId.toString(),
    reportDate: doc.reportDate,
    completedTasks: doc.completedTasks ?? [],
    workInProgress: doc.workInProgress ?? [],
    pendingTasks: doc.pendingTasks ?? [],
    challenges: doc.challenges ?? [],
    tomorrowPlan: doc.tomorrowPlan ?? [],
    summary: doc.summary ?? '',
    rawAIResponse: doc.rawAIResponse ?? '',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongoDailyReportRepository implements IDailyReportRepository {
  async create(input: CreateDailyReportInput): Promise<DailyReport> {
    const created = await DailyReportModel.create({
      projectId: new Types.ObjectId(input.projectId),
      reportDate: startOfDay(input.reportDate),
      completedTasks: input.completedTasks,
      workInProgress: input.workInProgress,
      pendingTasks: input.pendingTasks,
      challenges: input.challenges,
      tomorrowPlan: input.tomorrowPlan,
      summary: input.summary,
      rawAIResponse: input.rawAIResponse,
    });

    return mapReport(created);
  }

  async findById(id: string): Promise<DailyReport | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const doc = await DailyReportModel.findById(id).exec();
    return doc ? mapReport(doc) : null;
  }

  async findByProjectAndDate(
    projectId: string,
    reportDate: Date,
  ): Promise<DailyReport | null> {
    if (!Types.ObjectId.isValid(projectId)) {
      return null;
    }

    const doc = await DailyReportModel.findOne({
      projectId: new Types.ObjectId(projectId),
      reportDate: startOfDay(reportDate),
    }).exec();

    return doc ? mapReport(doc) : null;
  }

  async listByProject(projectId: string, limit = 100): Promise<DailyReport[]> {
    if (!Types.ObjectId.isValid(projectId)) {
      return [];
    }

    const docs = await DailyReportModel.find({
      projectId: new Types.ObjectId(projectId),
    })
      .sort({ reportDate: -1, createdAt: -1 })
      .limit(limit)
      .exec();

    return docs.map(mapReport);
  }
}

export const dailyReportRepository = new MongoDailyReportRepository();

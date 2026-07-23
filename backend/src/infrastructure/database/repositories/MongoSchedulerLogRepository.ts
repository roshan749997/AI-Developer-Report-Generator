import { Types } from 'mongoose';
import type {
  CreateSchedulerLogInput,
  ISchedulerLogRepository,
  ListSchedulerLogsFilter,
  SchedulerLogStats,
  UpdateSchedulerLogInput,
} from '../../../domain/repositories/ISchedulerLogRepository.js';
import type { SchedulerLog } from '../../../domain/entities/SchedulerLog.js';
import type { SchedulerJobType } from '../../../domain/entities/SchedulerLog.js';
import {
  SchedulerLogModel,
  type SchedulerLogDocument,
} from '../models/SchedulerLogModel.js';

function mapLog(doc: SchedulerLogDocument): SchedulerLog {
  return {
    id: doc._id.toString(),
    projectId: doc.projectId ? doc.projectId.toString() : null,
    jobType: doc.jobType as SchedulerLog['jobType'],
    status: doc.status as SchedulerLog['status'],
    startedAt: doc.startedAt,
    finishedAt: doc.finishedAt ?? null,
    duration: doc.duration ?? null,
    error: doc.error ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongoSchedulerLogRepository implements ISchedulerLogRepository {
  async create(input: CreateSchedulerLogInput): Promise<SchedulerLog> {
    const created = await SchedulerLogModel.create({
      projectId: input.projectId ? new Types.ObjectId(input.projectId) : null,
      jobType: input.jobType,
      status: input.status,
      startedAt: input.startedAt,
      finishedAt: input.finishedAt ?? null,
      duration: input.duration ?? null,
      error: input.error ?? null,
    });
    return mapLog(created);
  }

  async update(
    id: string,
    input: UpdateSchedulerLogInput,
  ): Promise<SchedulerLog | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const doc = await SchedulerLogModel.findByIdAndUpdate(
      id,
      { $set: input },
      { new: true },
    ).exec();

    return doc ? mapLog(doc) : null;
  }

  async list(filter: ListSchedulerLogsFilter = {}): Promise<SchedulerLog[]> {
    const query: Record<string, unknown> = {};

    if (filter.projectId) {
      query.projectId = new Types.ObjectId(filter.projectId);
    }
    if (filter.jobType) {
      query.jobType = filter.jobType;
    }
    if (filter.status) {
      query.status = filter.status;
    }
    if (filter.fromDate || filter.toDate) {
      query.startedAt = {
        ...(filter.fromDate ? { $gte: filter.fromDate } : {}),
        ...(filter.toDate ? { $lte: filter.toDate } : {}),
      };
    }

    const docs = await SchedulerLogModel.find(query)
      .sort({ startedAt: -1 })
      .limit(filter.limit ?? 100)
      .exec();

    return docs.map(mapLog);
  }

  async getLatest(jobType?: SchedulerJobType): Promise<SchedulerLog | null> {
    const query = jobType ? { jobType } : {};
    const doc = await SchedulerLogModel.findOne(query)
      .sort({ startedAt: -1 })
      .exec();
    return doc ? mapLog(doc) : null;
  }

  async getTodayStats(
    jobType: SchedulerJobType,
    fromDate: Date,
    toDate: Date,
  ): Promise<SchedulerLogStats> {
    const rows = await SchedulerLogModel.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          jobType,
          projectId: { $ne: null },
          startedAt: { $gte: fromDate, $lte: toDate },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]).exec();

    const stats: SchedulerLogStats = {
      generated: 0,
      failed: 0,
      skipped: 0,
    };

    for (const row of rows) {
      if (row._id === 'success') stats.generated = row.count;
      if (row._id === 'failed') stats.failed = row.count;
      if (row._id === 'skipped') stats.skipped = row.count;
    }

    return stats;
  }
}

export const schedulerLogRepository = new MongoSchedulerLogRepository();

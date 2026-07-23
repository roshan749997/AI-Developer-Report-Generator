import { Types } from 'mongoose';
import type {
  CreateScanRunInput,
  IScanRunRepository,
  UpdateScanRunInput,
} from '../../../domain/repositories/IScanRunRepository.js';
import type { ScanRun } from '../../../domain/entities/ScanRun.js';
import { ScanRunStatus } from '../../../domain/entities/ScanRun.js';
import { ScanRunModel, type ScanRunDocument } from '../models/ScanRunModel.js';

function mapRun(doc: ScanRunDocument): ScanRun {
  return {
    id: doc._id.toString(),
    projectId: doc.projectId.toString(),
    scheduleId: doc.scheduleId ? doc.scheduleId.toString() : null,
    triggeredByUserId: doc.triggeredByUserId ? doc.triggeredByUserId.toString() : null,
    trigger: doc.trigger,
    status: doc.status,
    branch: doc.branch,
    fromDate: doc.fromDate ?? null,
    toDate: doc.toDate ?? null,
    commitsScanned: doc.commitsScanned,
    commitsUpserted: doc.commitsUpserted,
    errorMessage: doc.errorMessage ?? null,
    startedAt: doc.startedAt ?? null,
    finishedAt: doc.finishedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongoScanRunRepository implements IScanRunRepository {
  async create(input: CreateScanRunInput): Promise<ScanRun> {
    const created = await ScanRunModel.create({
      projectId: input.projectId,
      scheduleId: input.scheduleId ?? null,
      triggeredByUserId: input.triggeredByUserId ?? null,
      trigger: input.trigger,
      status: input.status ?? ScanRunStatus.PENDING,
      branch: input.branch,
      fromDate: input.fromDate ?? null,
      toDate: input.toDate ?? null,
    });
    return mapRun(created);
  }

  async findById(id: string): Promise<ScanRun | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await ScanRunModel.findById(id).exec();
    return doc ? mapRun(doc) : null;
  }

  async listByProject(projectId: string, limit = 50): Promise<ScanRun[]> {
    const docs = await ScanRunModel.find({ projectId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
    return docs.map(mapRun);
  }

  async update(id: string, input: UpdateScanRunInput): Promise<ScanRun | null> {
    const doc = await ScanRunModel.findByIdAndUpdate(id, { $set: input }, { new: true }).exec();
    return doc ? mapRun(doc) : null;
  }
}

export const scanRunRepository = new MongoScanRunRepository();

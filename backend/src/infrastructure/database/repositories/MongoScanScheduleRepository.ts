import { Types } from 'mongoose';
import type {
  CreateScanScheduleInput,
  IScanScheduleRepository,
  UpdateScanScheduleInput,
} from '../../../domain/repositories/IScanScheduleRepository.js';
import type { ScanSchedule } from '../../../domain/entities/ScanSchedule.js';
import {
  ScanScheduleModel,
  type ScanScheduleDocument,
} from '../models/ScanScheduleModel.js';

function mapSchedule(doc: ScanScheduleDocument): ScanSchedule {
  return {
    id: doc._id.toString(),
    projectId: doc.projectId.toString(),
    ownerId: doc.ownerId.toString(),
    name: doc.name,
    cronExpression: doc.cronExpression,
    timezone: doc.timezone,
    isEnabled: doc.isEnabled,
    scanTodayOnly: doc.scanTodayOnly,
    lookbackDays: doc.lookbackDays,
    lastRunAt: doc.lastRunAt ?? null,
    lastRunStatus: doc.lastRunStatus ?? null,
    lastError: doc.lastError ?? null,
    nextRunAt: doc.nextRunAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongoScanScheduleRepository implements IScanScheduleRepository {
  async create(input: CreateScanScheduleInput): Promise<ScanSchedule> {
    const created = await ScanScheduleModel.create(input);
    return mapSchedule(created);
  }

  async findById(id: string): Promise<ScanSchedule | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await ScanScheduleModel.findById(id).exec();
    return doc ? mapSchedule(doc) : null;
  }

  async listByOwner(ownerId: string): Promise<ScanSchedule[]> {
    const docs = await ScanScheduleModel.find({ ownerId }).sort({ createdAt: -1 }).exec();
    return docs.map(mapSchedule);
  }

  async listEnabled(): Promise<ScanSchedule[]> {
    const docs = await ScanScheduleModel.find({ isEnabled: true }).exec();
    return docs.map(mapSchedule);
  }

  async listAll(): Promise<ScanSchedule[]> {
    const docs = await ScanScheduleModel.find().sort({ createdAt: -1 }).exec();
    return docs.map(mapSchedule);
  }

  async update(id: string, input: UpdateScanScheduleInput): Promise<ScanSchedule | null> {
    const doc = await ScanScheduleModel.findByIdAndUpdate(
      id,
      { $set: input },
      { new: true, runValidators: true },
    ).exec();
    return doc ? mapSchedule(doc) : null;
  }

  async setEnabled(id: string, isEnabled: boolean): Promise<ScanSchedule | null> {
    return this.update(id, { isEnabled });
  }

  async delete(id: string): Promise<boolean> {
    const result = await ScanScheduleModel.findByIdAndDelete(id).exec();
    return Boolean(result);
  }
}

export const scanScheduleRepository = new MongoScanScheduleRepository();

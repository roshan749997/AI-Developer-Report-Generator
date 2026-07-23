import type { ScanSchedule } from '../entities/ScanSchedule.js';

export interface CreateScanScheduleInput {
  projectId: string;
  ownerId: string;
  name: string;
  cronExpression: string;
  timezone: string;
  isEnabled: boolean;
  scanTodayOnly: boolean;
  lookbackDays: number;
}

export interface UpdateScanScheduleInput {
  name?: string;
  cronExpression?: string;
  timezone?: string;
  scanTodayOnly?: boolean;
  lookbackDays?: number;
  isEnabled?: boolean;
  lastRunAt?: Date | null;
  lastRunStatus?: 'success' | 'failed' | null;
  lastError?: string | null;
  nextRunAt?: Date | null;
}

export interface IScanScheduleRepository {
  create(input: CreateScanScheduleInput): Promise<ScanSchedule>;
  findById(id: string): Promise<ScanSchedule | null>;
  listByOwner(ownerId: string): Promise<ScanSchedule[]>;
  listEnabled(): Promise<ScanSchedule[]>;
  listAll(): Promise<ScanSchedule[]>;
  update(id: string, input: UpdateScanScheduleInput): Promise<ScanSchedule | null>;
  setEnabled(id: string, isEnabled: boolean): Promise<ScanSchedule | null>;
  delete(id: string): Promise<boolean>;
}

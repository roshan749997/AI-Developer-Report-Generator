import type { ScanRun, ScanRunStatus, ScanTrigger } from '../entities/ScanRun.js';

export interface CreateScanRunInput {
  projectId: string;
  scheduleId?: string | null;
  triggeredByUserId?: string | null;
  trigger: ScanTrigger;
  branch: string;
  fromDate?: Date | null;
  toDate?: Date | null;
  status?: ScanRunStatus;
}

export interface UpdateScanRunInput {
  status?: ScanRunStatus;
  commitsScanned?: number;
  commitsUpserted?: number;
  errorMessage?: string | null;
  startedAt?: Date | null;
  finishedAt?: Date | null;
}

export interface IScanRunRepository {
  create(input: CreateScanRunInput): Promise<ScanRun>;
  findById(id: string): Promise<ScanRun | null>;
  listByProject(projectId: string, limit?: number): Promise<ScanRun[]>;
  update(id: string, input: UpdateScanRunInput): Promise<ScanRun | null>;
}

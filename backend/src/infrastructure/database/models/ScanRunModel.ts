import { Schema, model, type Document, type Types } from 'mongoose';
import {
  ScanRunStatus,
  ScanTrigger,
  type ScanRunStatus as ScanRunStatusType,
  type ScanTrigger as ScanTriggerType,
} from '../../../domain/entities/ScanRun.js';

export interface ScanRunDocument extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  scheduleId?: Types.ObjectId | null;
  triggeredByUserId?: Types.ObjectId | null;
  trigger: ScanTriggerType;
  status: ScanRunStatusType;
  branch: string;
  fromDate?: Date | null;
  toDate?: Date | null;
  commitsScanned: number;
  commitsUpserted: number;
  errorMessage?: string | null;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const scanRunSchema = new Schema<ScanRunDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    scheduleId: { type: Schema.Types.ObjectId, ref: 'ScanSchedule', default: null },
    triggeredByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    trigger: {
      type: String,
      enum: Object.values(ScanTrigger),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ScanRunStatus),
      required: true,
      default: ScanRunStatus.PENDING,
      index: true,
    },
    branch: { type: String, required: true },
    fromDate: { type: Date, default: null },
    toDate: { type: Date, default: null },
    commitsScanned: { type: Number, default: 0 },
    commitsUpserted: { type: Number, default: 0 },
    errorMessage: { type: String, default: null },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

scanRunSchema.index({ projectId: 1, createdAt: -1 });

export const ScanRunModel = model<ScanRunDocument>('ScanRun', scanRunSchema);

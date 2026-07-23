import { Schema, model, type Document, type Types } from 'mongoose';

export interface ScanScheduleDocument extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  ownerId: Types.ObjectId;
  name: string;
  cronExpression: string;
  timezone: string;
  isEnabled: boolean;
  scanTodayOnly: boolean;
  lookbackDays: number;
  lastRunAt?: Date | null;
  lastRunStatus?: 'success' | 'failed' | null;
  lastError?: string | null;
  nextRunAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const scanScheduleSchema = new Schema<ScanScheduleDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    cronExpression: { type: String, required: true, trim: true },
    timezone: { type: String, required: true, default: 'UTC' },
    isEnabled: { type: Boolean, default: true, index: true },
    scanTodayOnly: { type: Boolean, default: false },
    lookbackDays: { type: Number, default: 7, min: 1, max: 365 },
    lastRunAt: { type: Date, default: null },
    lastRunStatus: {
      type: String,
      enum: ['success', 'failed', null],
      default: null,
    },
    lastError: { type: String, default: null },
    nextRunAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

scanScheduleSchema.index({ ownerId: 1, projectId: 1, name: 1 }, { unique: true });

export const ScanScheduleModel = model<ScanScheduleDocument>(
  'ScanSchedule',
  scanScheduleSchema,
);

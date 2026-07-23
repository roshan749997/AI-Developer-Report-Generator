import { Schema, model, type Document, type Types } from 'mongoose';
import {
  SchedulerJobType,
  SchedulerLogStatus,
} from '../../../domain/entities/SchedulerLog.js';

export interface SchedulerLogDocument extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId | null;
  jobType: string;
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
  duration: number | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const schedulerLogSchema = new Schema<SchedulerLogDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true,
    },
    jobType: {
      type: String,
      enum: Object.values(SchedulerJobType),
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(SchedulerLogStatus),
      required: true,
      index: true,
    },
    startedAt: { type: Date, required: true, index: true },
    finishedAt: { type: Date, default: null },
    duration: { type: Number, default: null, min: 0 },
    error: { type: String, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'SchedulerLogs',
  },
);

schedulerLogSchema.index({ startedAt: -1 });
schedulerLogSchema.index({ jobType: 1, startedAt: -1 });

export const SchedulerLogModel = model<SchedulerLogDocument>(
  'SchedulerLog',
  schedulerLogSchema,
);

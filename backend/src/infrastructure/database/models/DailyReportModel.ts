import { Schema, model, type Document, type Types } from 'mongoose';

export interface DailyReportDocument extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  reportDate: Date;
  completedTasks: string[];
  workInProgress: string[];
  pendingTasks: string[];
  challenges: string[];
  tomorrowPlan: string[];
  summary: string;
  rawAIResponse: string;
  createdAt: Date;
  updatedAt: Date;
}

const dailyReportSchema = new Schema<DailyReportDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    reportDate: { type: Date, required: true, index: true },
    completedTasks: { type: [String], default: [] },
    workInProgress: { type: [String], default: [] },
    pendingTasks: { type: [String], default: [] },
    challenges: { type: [String], default: [] },
    tomorrowPlan: { type: [String], default: [] },
    summary: { type: String, default: '' },
    rawAIResponse: { type: String, default: '' },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'Reports',
  },
);

dailyReportSchema.index({ projectId: 1, reportDate: 1 }, { unique: true });
dailyReportSchema.index({ projectId: 1, createdAt: -1 });

export const DailyReportModel = model<DailyReportDocument>(
  'DailyReport',
  dailyReportSchema,
);

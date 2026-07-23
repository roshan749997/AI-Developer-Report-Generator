import { Schema, model, type Document, type Types } from 'mongoose';
import { AiReportStatus } from '../../../domain/entities/AiReport.js';

const contentSchema = new Schema(
  {
    tasksCompleted: { type: [String], default: [] },
    workInProgress: { type: [String], default: [] },
    pendingTasks: { type: [String], default: [] },
    challenges: { type: [String], default: [] },
    tomorrowPlan: { type: [String], default: [] },
    summary: { type: String, default: '' },
    importantNotes: { type: [String], default: [] },
  },
  { _id: false },
);

const commitSnapshotSchema = new Schema(
  {
    commitHash: String,
    shortHash: String,
    authorName: String,
    authorEmail: String,
    authoredAt: Date,
    branch: String,
    commitMessage: String,
    changedFiles: [String],
    renamedFiles: [String],
    deletedFiles: [String],
    insertions: Number,
    deletions: Number,
    categories: [String],
    gitDiffExcerpt: String,
  },
  { _id: false },
);

const previousSnapshotSchema = new Schema(
  {
    reportId: String,
    reportDate: Date,
    summary: String,
    tasksCompleted: [String],
    workInProgress: [String],
    pendingTasks: [String],
    tomorrowPlan: [String],
  },
  { _id: false },
);

export interface AiReportDocument extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  projectName: string;
  generatedByUserId: Types.ObjectId;
  status: string;
  reportDate: Date;
  fromDate: Date;
  toDate: Date;
  modelName: string;
  openaiResponseId?: string | null;
  content: {
    tasksCompleted: string[];
    workInProgress: string[];
    pendingTasks: string[];
    challenges: string[];
    tomorrowPlan: string[];
    summary: string;
    importantNotes: string[];
  };
  inputCommits: Array<Record<string, unknown>>;
  previousReports: Array<Record<string, unknown>>;
  promptVersion: string;
  rawOutput?: string | null;
  errorMessage?: string | null;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

const aiReportSchema = new Schema<AiReportDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    projectName: { type: String, required: true },
    generatedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: Object.values(AiReportStatus),
      required: true,
      index: true,
    },
    reportDate: { type: Date, required: true, index: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    modelName: { type: String, required: true },
    openaiResponseId: { type: String, default: null },
    content: { type: contentSchema, required: true },
    inputCommits: { type: [commitSnapshotSchema], default: [] },
    previousReports: { type: [previousSnapshotSchema], default: [] },
    promptVersion: { type: String, required: true },
    rawOutput: { type: String, default: null },
    errorMessage: { type: String, default: null },
    usage: {
      type: new Schema(
        {
          inputTokens: Number,
          outputTokens: Number,
          totalTokens: Number,
        },
        { _id: false },
      ),
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

aiReportSchema.index({ projectId: 1, createdAt: -1 });

export const AiReportModel = model<AiReportDocument>('AiReport', aiReportSchema);

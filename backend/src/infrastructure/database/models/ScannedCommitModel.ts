import { Schema, model, type Document, type Types } from 'mongoose';
import {
  COMMIT_CATEGORIES,
  type CommitCategory,
} from '../../../domain/entities/ScannedCommit.js';

export interface ScannedCommitDocument extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  scanRunId: Types.ObjectId;
  commitHash: string;
  shortHash: string;
  authorName: string;
  authorEmail: string;
  authoredAt: Date;
  branch: string;
  commitMessage: string;
  changedFiles: string[];
  renamedFiles: string[];
  deletedFiles: string[];
  insertions: number;
  deletions: number;
  gitDiff: string;
  gitDiffTruncated: boolean;
  categories: CommitCategory[];
  createdAt: Date;
  updatedAt: Date;
}

const scannedCommitSchema = new Schema<ScannedCommitDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    scanRunId: { type: Schema.Types.ObjectId, ref: 'ScanRun', required: true, index: true },
    commitHash: { type: String, required: true, index: true },
    shortHash: { type: String, required: true },
    authorName: { type: String, required: true, trim: true },
    authorEmail: { type: String, required: true, trim: true, lowercase: true, index: true },
    authoredAt: { type: Date, required: true, index: true },
    branch: { type: String, required: true, index: true },
    commitMessage: { type: String, required: true },
    changedFiles: { type: [String], default: [] },
    renamedFiles: { type: [String], default: [] },
    deletedFiles: { type: [String], default: [] },
    insertions: { type: Number, default: 0, min: 0 },
    deletions: { type: Number, default: 0, min: 0 },
    gitDiff: { type: String, default: '' },
    gitDiffTruncated: { type: Boolean, default: false },
    categories: {
      type: [String],
      enum: COMMIT_CATEGORIES,
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

scannedCommitSchema.index({ projectId: 1, commitHash: 1 }, { unique: true });
scannedCommitSchema.index({ projectId: 1, authoredAt: -1 });
scannedCommitSchema.index({ projectId: 1, categories: 1 });

export const ScannedCommitModel = model<ScannedCommitDocument>(
  'ScannedCommit',
  scannedCommitSchema,
);

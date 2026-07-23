import { Schema, model, type Document, type Types } from 'mongoose';

export interface GitActivityDocument extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  repositoryName: string;
  branch: string;
  commitHash: string;
  commitMessage: string;
  author: string;
  commitDate: Date;
  changedFiles: string[];
  insertions: number;
  deletions: number;
  createdAt: Date;
  updatedAt: Date;
}

const gitActivitySchema = new Schema<GitActivityDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    repositoryName: { type: String, required: true, trim: true, index: true },
    branch: { type: String, required: true, trim: true, index: true },
    commitHash: { type: String, required: true, index: true },
    commitMessage: { type: String, required: true },
    author: { type: String, required: true, trim: true, index: true },
    commitDate: { type: Date, required: true, index: true },
    changedFiles: { type: [String], default: [] },
    insertions: { type: Number, default: 0, min: 0 },
    deletions: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'GitActivities',
  },
);

gitActivitySchema.index({ projectId: 1, commitHash: 1 }, { unique: true });
gitActivitySchema.index({ projectId: 1, commitDate: -1 });
gitActivitySchema.index({ createdAt: -1 });

export const GitActivityModel = model<GitActivityDocument>(
  'GitActivity',
  gitActivitySchema,
);

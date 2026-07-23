import { Schema, model, type Document, type Types } from 'mongoose';

export interface ProjectDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  localGitPath: string;
  gitBranch: string;
  description: string;
  tags: string[];
  isEnabled: boolean;
  ownerId: Types.ObjectId;
  lastValidatedAt?: Date | null;
  lastConnectionStatus?: 'success' | 'failed' | null;
  lastConnectionMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<ProjectDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    localGitPath: { type: String, required: true, trim: true, maxlength: 500 },
    gitBranch: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', trim: true, maxlength: 2000 },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (tags: string[]) => tags.length <= 20,
        message: 'A project can have at most 20 tags',
      },
    },
    isEnabled: { type: Boolean, default: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lastValidatedAt: { type: Date, default: null },
    lastConnectionStatus: {
      type: String,
      enum: ['success', 'failed', null],
      default: null,
    },
    lastConnectionMessage: { type: String, default: null, maxlength: 500 },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        const value = ret as Record<string, unknown>;
        value.id = String(value._id);
        value.ownerId = String(value.ownerId);
        delete value._id;
        return value;
      },
    },
  },
);

projectSchema.index({ ownerId: 1, name: 1 }, { unique: true });
projectSchema.index({ tags: 1 });
projectSchema.index({ name: 'text', description: 'text' });

export const ProjectModel = model<ProjectDocument>('Project', projectSchema);

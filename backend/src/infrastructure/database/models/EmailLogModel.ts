import { Schema, model, type Document, type Types } from 'mongoose';
import { EmailLogStatus } from '../../../domain/entities/EmailLog.js';

export interface EmailLogDocument extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  reportId: Types.ObjectId;
  recipient: string;
  subject: string;
  status: string;
  error: string | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const emailLogSchema = new Schema<EmailLogDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    reportId: {
      type: Schema.Types.ObjectId,
      ref: 'DailyReport',
      required: true,
      index: true,
    },
    recipient: { type: String, required: true, trim: true, lowercase: true, index: true },
    subject: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(EmailLogStatus),
      required: true,
      index: true,
    },
    error: { type: String, default: null },
    sentAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'EmailLogs',
  },
);

emailLogSchema.index({ createdAt: -1 });

export const EmailLogModel = model<EmailLogDocument>('EmailLog', emailLogSchema);

import { Schema, model, type Document, type Types } from 'mongoose';

export interface AuditLogDocument extends Document {
  _id: Types.ObjectId;
  organizationId?: Types.ObjectId | null;
  userId: Types.ObjectId;
  userEmail: string;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<AuditLogDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userEmail: { type: String, required: true },
    action: { type: String, required: true, index: true },
    resourceType: { type: String, default: null },
    resourceId: { type: String, default: null },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    collection: 'AuditLogs',
  },
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLogModel = model<AuditLogDocument>('AuditLog', auditLogSchema);

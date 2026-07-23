import { Schema, model, type Document, type Types } from 'mongoose';
import { ActivityEventType } from '../../../domain/entities/ActivityEvent.js';

export interface ActivityEventDocument extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  actorUserId?: Types.ObjectId | null;
  type: string;
  title: string;
  description?: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const activityEventSchema = new Schema<ActivityEventDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    actorUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    type: {
      type: String,
      enum: Object.values(ActivityEventType),
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    collection: 'ActivityEvents',
  },
);

activityEventSchema.index({ organizationId: 1, createdAt: -1 });

export const ActivityEventModel = model<ActivityEventDocument>(
  'ActivityEvent',
  activityEventSchema,
);

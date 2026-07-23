import { Schema, model, type Document, type Types } from 'mongoose';
import { NotificationType } from '../../../domain/entities/Notification.js';

export interface NotificationDocument extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  type: string;
  title: string;
  message: string;
  meta?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    meta: { type: Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'Notifications',
  },
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export const NotificationModel = model<NotificationDocument>(
  'Notification',
  notificationSchema,
);

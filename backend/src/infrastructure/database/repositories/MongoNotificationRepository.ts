import { Types } from 'mongoose';
import type {
  CreateNotificationInput,
  INotificationRepository,
} from '../../../domain/repositories/INotificationRepository.js';
import type { Notification } from '../../../domain/entities/Notification.js';
import {
  NotificationModel,
  type NotificationDocument,
} from '../models/NotificationModel.js';

function mapNotification(doc: NotificationDocument): Notification {
  return {
    id: doc._id.toString(),
    organizationId: doc.organizationId.toString(),
    userId: doc.userId.toString(),
    type: doc.type as Notification['type'],
    title: doc.title,
    message: doc.message,
    meta: doc.meta ?? {},
    isRead: doc.isRead,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongoNotificationRepository implements INotificationRepository {
  async create(input: CreateNotificationInput): Promise<Notification> {
    const created = await NotificationModel.create({
      organizationId: new Types.ObjectId(input.organizationId),
      userId: new Types.ObjectId(input.userId),
      type: input.type,
      title: input.title,
      message: input.message,
      meta: input.meta ?? {},
      isRead: false,
    });
    return mapNotification(created);
  }

  async listByUser(userId: string, limit = 50): Promise<Notification[]> {
    const docs = await NotificationModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
    return docs.map(mapNotification);
  }

  async markRead(id: string, userId: string): Promise<Notification | null> {
    const doc = await NotificationModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: { isRead: true } },
      { new: true },
    ).exec();
    return doc ? mapNotification(doc) : null;
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await NotificationModel.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } },
    ).exec();
    return result.modifiedCount;
  }

  async countUnread(userId: string): Promise<number> {
    return NotificationModel.countDocuments({ userId, isRead: false }).exec();
  }
}

export const notificationRepository = new MongoNotificationRepository();

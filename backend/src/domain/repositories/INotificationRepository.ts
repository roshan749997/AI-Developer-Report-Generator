import type { Notification, NotificationType } from '../entities/Notification.js';

export interface CreateNotificationInput {
  organizationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  meta?: Record<string, unknown>;
}

export interface INotificationRepository {
  create(input: CreateNotificationInput): Promise<Notification>;
  listByUser(userId: string, limit?: number): Promise<Notification[]>;
  markRead(id: string, userId: string): Promise<Notification | null>;
  markAllRead(userId: string): Promise<number>;
  countUnread(userId: string): Promise<number>;
}

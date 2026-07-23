import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { INotificationRepository } from '../../../domain/repositories/INotificationRepository.js';
import type { IAuditLogRepository } from '../../../domain/repositories/IAuditLogRepository.js';
import type { IActivityEventRepository } from '../../../domain/repositories/IActivityEventRepository.js';
import { toPublicUser, UserRole, type PublicUser } from '../../../domain/entities/User.js';
import type { Notification } from '../../../domain/entities/Notification.js';
import type { AuditLog } from '../../../domain/entities/AuditLog.js';
import type { ActivityEvent } from '../../../domain/entities/ActivityEvent.js';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../../shared/errors/index.js';
import { permissionsForRole } from '../../../domain/rbac/permissions.js';

export class SaasUserService {
  constructor(private readonly users: IUserRepository) {}

  async listOrgUsers(actorId: string): Promise<PublicUser[]> {
    const actor = await this.users.findById(actorId);
    if (!actor?.organizationId) return [];
    if (actor.role === UserRole.DEVELOPER) {
      throw new ForbiddenError('Developers cannot list organization users');
    }
    const users = await this.users.listByOrganization(actor.organizationId);
    return users.map(toPublicUser);
  }

  async removeUser(actorId: string, targetUserId: string): Promise<PublicUser> {
    const actor = await this.users.findById(actorId);
    if (!actor?.organizationId || actor.role !== UserRole.ADMIN) {
      throw new ForbiddenError('Only admins can remove users');
    }
    if (actor.id === targetUserId) {
      throw new BadRequestError('You cannot remove yourself');
    }

    const target = await this.users.findById(targetUserId);
    if (!target || target.organizationId !== actor.organizationId) {
      throw new NotFoundError('User not found in your organization');
    }

    const deactivated = await this.users.deactivate(target.id);
    if (!deactivated) throw new BadRequestError('Failed to remove user');
    return toPublicUser(deactivated);
  }

  async updateProfile(
    actorId: string,
    input: {
      name?: string;
      email?: string;
      avatarUrl?: string | null;
      timezone?: string;
      workingHours?: { start: string; end: string };
      gitUsername?: string | null;
    },
  ): Promise<PublicUser> {
    const updated = await this.users.updateProfile(actorId, input);
    if (!updated) throw new NotFoundError('User not found');
    return toPublicUser(updated);
  }

  async getProfile(actorId: string): Promise<PublicUser & { permissions: string[] }> {
    const user = await this.users.findById(actorId);
    if (!user) throw new NotFoundError('User not found');
    return {
      ...toPublicUser(user),
      permissions: permissionsForRole(user.role),
    };
  }
}

export class NotificationService {
  constructor(private readonly notifications: INotificationRepository) {}

  list(userId: string, limit = 50): Promise<Notification[]> {
    return this.notifications.listByUser(userId, limit);
  }

  unreadCount(userId: string): Promise<number> {
    return this.notifications.countUnread(userId);
  }

  async markRead(userId: string, id: string): Promise<Notification> {
    const updated = await this.notifications.markRead(id, userId);
    if (!updated) throw new NotFoundError('Notification not found');
    return updated;
  }

  markAllRead(userId: string): Promise<number> {
    return this.notifications.markAllRead(userId);
  }
}

export class AuditService {
  constructor(private readonly audits: IAuditLogRepository) {}

  async list(actorId: string, users: IUserRepository, limit = 100): Promise<AuditLog[]> {
    const actor = await users.findById(actorId);
    if (!actor?.organizationId || actor.role !== UserRole.ADMIN) {
      throw new ForbiddenError('Only admins can view audit logs');
    }
    return this.audits.listByOrganization(actor.organizationId, limit);
  }
}

export class TimelineService {
  constructor(private readonly activities: IActivityEventRepository) {}

  async list(actorId: string, users: IUserRepository, limit = 50): Promise<ActivityEvent[]> {
    const actor = await users.findById(actorId);
    if (!actor?.organizationId) return [];
    return this.activities.listByOrganization(actor.organizationId, limit);
  }
}

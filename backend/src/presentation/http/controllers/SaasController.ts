import type { Request, Response } from 'express';
import {
  organizationService,
  invitationService,
  saasUserService,
  notificationService,
  auditService,
  timelineService,
} from '../../../application/services/saas/index.js';
import { userRepository } from '../../../infrastructure/database/repositories/MongoUserRepository.js';
import { recordAudit } from '../../../application/services/saas/auditHelper.js';
import { UnauthorizedError } from '../../../shared/errors/index.js';
import { ApiResponse } from '../response/index.js';
import type { UserRole } from '../../../domain/entities/User.js';

function requireUser(req: Request) {
  if (!req.user) throw new UnauthorizedError('Authentication required');
  return req.user;
}

export class SaasController {
  createOrganization = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const body = req.body as { name: string; logoUrl?: string | null };
    const result = await organizationService.create({
      actorId: user.id,
      name: body.name,
      logoUrl: body.logoUrl,
    });
    recordAudit(req, 'organization.create', {
      resourceType: 'organization',
      resourceId: result.organization.id,
    });
    return ApiResponse.created(
      res,
      result,
      'Organization created',
    );
  };

  getOrganization = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const org = await organizationService.getMine(user.id);
    return ApiResponse.success(res, org, 'Organization retrieved');
  };

  updateOrganization = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const org = await organizationService.updateSettings(user.id, user.role, req.body);
    recordAudit(req, 'organization.update', {
      resourceType: 'organization',
      resourceId: org.id,
    });
    return ApiResponse.success(res, org, 'Organization updated');
  };

  inviteUser = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const body = req.body as { email: string; role: UserRole };
    const result = await invitationService.invite({
      actorId: user.id,
      actorRole: user.role,
      email: body.email,
      role: body.role,
    });
    recordAudit(req, 'user.invite', {
      resourceType: 'invitation',
      resourceId: result.invitation.id,
      meta: { email: body.email, role: body.role },
    });
    return ApiResponse.created(
      res,
      {
        invitation: result.invitation,
        // Returned once so the admin can share the invite link.
        inviteToken: result.inviteToken,
      },
      'Invitation created',
    );
  };

  listInvitations = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const invitations = await invitationService.list(user.id);
    return ApiResponse.success(res, invitations, 'Invitations retrieved');
  };

  acceptInvitation = async (req: Request, res: Response) => {
    const body = req.body as { token: string; name: string; password: string };
    const profile = await invitationService.accept(body);
    return ApiResponse.success(res, profile, 'Invitation accepted');
  };

  revokeInvitation = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const invitation = await invitationService.revoke(
      user.id,
      req.params.invitationId!,
    );
    recordAudit(req, 'user.invite_revoke', {
      resourceType: 'invitation',
      resourceId: invitation.id,
    });
    return ApiResponse.success(res, invitation, 'Invitation revoked');
  };

  listUsers = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const users = await saasUserService.listOrgUsers(user.id);
    return ApiResponse.success(res, users, 'Users retrieved');
  };

  removeUser = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const removed = await saasUserService.removeUser(user.id, req.params.userId!);
    recordAudit(req, 'user.delete', {
      resourceType: 'user',
      resourceId: removed.id,
    });
    return ApiResponse.success(res, removed, 'User removed');
  };

  getProfile = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const profile = await saasUserService.getProfile(user.id);
    return ApiResponse.success(res, profile, 'Profile retrieved');
  };

  updateProfile = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const profile = await saasUserService.updateProfile(user.id, req.body);
    recordAudit(req, 'user.profile_update', { resourceType: 'user', resourceId: user.id });
    return ApiResponse.success(res, profile, 'Profile updated');
  };

  listNotifications = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const limit = Number((req.query as { limit?: string }).limit ?? 50);
    const [items, unreadCount] = await Promise.all([
      notificationService.list(user.id, limit),
      notificationService.unreadCount(user.id),
    ]);
    return ApiResponse.success(res, { items, unreadCount }, 'Notifications retrieved');
  };

  markNotificationRead = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const item = await notificationService.markRead(
      user.id,
      req.params.notificationId!,
    );
    return ApiResponse.success(res, item, 'Notification marked as read');
  };

  markAllNotificationsRead = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const count = await notificationService.markAllRead(user.id);
    return ApiResponse.success(res, { count }, 'All notifications marked as read');
  };

  listAuditLogs = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const limit = Number((req.query as { limit?: string }).limit ?? 100);
    const logs = await auditService.list(user.id, userRepository, limit);
    return ApiResponse.success(res, logs, 'Audit logs retrieved');
  };

  listTimeline = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const limit = Number((req.query as { limit?: string }).limit ?? 50);
    const events = await timelineService.list(user.id, userRepository, limit);
    return ApiResponse.success(res, events, 'Activity timeline retrieved');
  };
}

export const saasController = new SaasController();

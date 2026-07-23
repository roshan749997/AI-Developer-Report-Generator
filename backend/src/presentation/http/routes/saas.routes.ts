import { Router } from 'express';
import { saasController } from '../controllers/SaasController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import {
  authenticate,
  requirePermission,
  requireOrganization,
} from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import { Permission } from '../../../domain/rbac/permissions.js';
import {
  acceptInviteSchema,
  createOrganizationSchema,
  invitationIdParamSchema,
  inviteUserSchema,
  listLimitQuerySchema,
  notificationIdParamSchema,
  updateOrganizationSchema,
  userIdParamSchema,
} from '../validation/saas.validation.js';

export const organizationRouter = Router();
export const saasUsersRouter = Router();
export const invitationRouter = Router();
export const notificationRouter = Router();
export const auditRouter = Router();
export const timelineRouter = Router();
export const profileRouter = Router();

organizationRouter.post(
  '/',
  authenticate,
  validate({ body: createOrganizationSchema }),
  asyncHandler(saasController.createOrganization),
);

organizationRouter.get(
  '/me',
  authenticate,
  asyncHandler(saasController.getOrganization),
);

organizationRouter.patch(
  '/me',
  authenticate,
  requirePermission(Permission.ORG_MANAGE),
  requireOrganization,
  validate({ body: updateOrganizationSchema }),
  asyncHandler(saasController.updateOrganization),
);

saasUsersRouter.use(authenticate, requireOrganization);

saasUsersRouter.get(
  '/',
  requirePermission(Permission.USER_LIST),
  asyncHandler(saasController.listUsers),
);

saasUsersRouter.delete(
  '/:userId',
  requirePermission(Permission.USER_DELETE),
  validate({ params: userIdParamSchema }),
  asyncHandler(saasController.removeUser),
);

invitationRouter.post(
  '/',
  authenticate,
  requireOrganization,
  requirePermission(Permission.USER_INVITE),
  validate({ body: inviteUserSchema }),
  asyncHandler(saasController.inviteUser),
);

invitationRouter.get(
  '/',
  authenticate,
  requireOrganization,
  requirePermission(Permission.USER_INVITE),
  asyncHandler(saasController.listInvitations),
);

invitationRouter.post(
  '/accept',
  validate({ body: acceptInviteSchema }),
  asyncHandler(saasController.acceptInvitation),
);

invitationRouter.post(
  '/:invitationId/revoke',
  authenticate,
  requireOrganization,
  requirePermission(Permission.USER_INVITE),
  validate({ params: invitationIdParamSchema }),
  asyncHandler(saasController.revokeInvitation),
);

notificationRouter.use(authenticate);

notificationRouter.get(
  '/',
  requirePermission(Permission.NOTIFICATION_VIEW),
  validate({ query: listLimitQuerySchema }),
  asyncHandler(saasController.listNotifications),
);

notificationRouter.post(
  '/read-all',
  requirePermission(Permission.NOTIFICATION_VIEW),
  asyncHandler(saasController.markAllNotificationsRead),
);

notificationRouter.post(
  '/:notificationId/read',
  requirePermission(Permission.NOTIFICATION_VIEW),
  validate({ params: notificationIdParamSchema }),
  asyncHandler(saasController.markNotificationRead),
);

auditRouter.get(
  '/',
  authenticate,
  requireOrganization,
  requirePermission(Permission.AUDIT_VIEW),
  validate({ query: listLimitQuerySchema }),
  asyncHandler(saasController.listAuditLogs),
);

timelineRouter.get(
  '/',
  authenticate,
  requireOrganization,
  requirePermission(Permission.ORG_VIEW),
  validate({ query: listLimitQuerySchema }),
  asyncHandler(saasController.listTimeline),
);

profileRouter.use(authenticate);

profileRouter.get('/', asyncHandler(saasController.getProfile));

profileRouter.patch('/', asyncHandler(saasController.updateProfile));

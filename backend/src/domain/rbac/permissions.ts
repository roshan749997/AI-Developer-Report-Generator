import type { UserRole } from '../entities/User.js';

/**
 * Fine-grained SaaS permissions used by RBAC middleware.
 */
export const Permission = {
  ORG_CREATE: 'org:create',
  ORG_MANAGE: 'org:manage',
  ORG_VIEW: 'org:view',
  USER_INVITE: 'user:invite',
  USER_DELETE: 'user:delete',
  USER_LIST: 'user:list',
  PROJECT_CREATE_ANY: 'project:create_any',
  PROJECT_MANAGE_OWN: 'project:manage_own',
  PROJECT_VIEW_TEAM: 'project:view_team',
  REPORT_VIEW_ALL: 'report:view_all',
  REPORT_VIEW_TEAM: 'report:view_team',
  REPORT_VIEW_OWN: 'report:view_own',
  REPORT_GENERATE: 'report:generate',
  REPORT_EXPORT: 'report:export',
  REPORT_EMAIL: 'report:email',
  ACTIVITY_VIEW_ALL: 'activity:view_all',
  ACTIVITY_VIEW_TEAM: 'activity:view_team',
  SCHEDULER_CONFIGURE: 'scheduler:configure',
  AI_CONFIGURE: 'ai:configure',
  AUDIT_VIEW: 'audit:view',
  NOTIFICATION_VIEW: 'notification:view',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

const ADMIN_PERMISSIONS: Permission[] = Object.values(Permission);

const MANAGER_PERMISSIONS: Permission[] = [
  Permission.ORG_VIEW,
  Permission.USER_LIST,
  Permission.PROJECT_VIEW_TEAM,
  Permission.REPORT_VIEW_TEAM,
  Permission.REPORT_EXPORT,
  Permission.REPORT_EMAIL,
  Permission.ACTIVITY_VIEW_TEAM,
  Permission.NOTIFICATION_VIEW,
];

const DEVELOPER_PERMISSIONS: Permission[] = [
  Permission.ORG_VIEW,
  Permission.PROJECT_MANAGE_OWN,
  Permission.REPORT_GENERATE,
  Permission.REPORT_VIEW_OWN,
  Permission.REPORT_EXPORT,
  Permission.NOTIFICATION_VIEW,
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: ADMIN_PERMISSIONS,
  manager: MANAGER_PERMISSIONS,
  developer: DEVELOPER_PERMISSIONS,
};

export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function permissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

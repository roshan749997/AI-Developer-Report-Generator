import { apiClient } from '@/services/apiClient';

export type UserRole = 'developer' | 'manager' | 'admin';

export interface WorkingHours {
  start: string;
  end: string;
}

export interface OrganizationSettings {
  workingDays: number[];
  defaultReportTime: string;
  defaultAiModel: string;
  emailSettings: {
    enabled: boolean;
    defaultRecipients: string[];
  };
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  ownerId: string;
  settings: OrganizationSettings;
  createdAt: string;
  updatedAt: string;
}

export interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId?: string | null;
  avatarUrl?: string | null;
  timezone?: string;
  workingHours?: WorkingHours;
  gitUsername?: string | null;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Profile extends OrgUser {
  permissions: string[];
}

export interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  role: UserRole;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expiresAt: string;
  acceptedAt?: string | null;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  organizationId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  organizationId?: string | null;
  userId: string;
  userEmail: string;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  ip?: string | null;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  organizationId: string;
  actorUserId?: string | null;
  type: string;
  title: string;
  description?: string;
  createdAt: string;
}

export const saasApi = {
  createOrganization: (payload: { name: string; logoUrl?: string | null }) =>
    apiClient.post<{
      organization: Organization;
      user: OrgUser;
      tokens: { accessToken: string; refreshToken: string };
    }>('/organizations', payload),

  getOrganization: () => apiClient.get<Organization>('/organizations/me'),

  updateOrganization: (payload: {
    name?: string;
    logoUrl?: string | null;
    settings?: Partial<OrganizationSettings>;
  }) => apiClient.patch<Organization>('/organizations/me', payload),

  listUsers: () => apiClient.get<OrgUser[]>('/org/users'),

  removeUser: (userId: string) => apiClient.delete<OrgUser>(`/org/users/${userId}`),

  inviteUser: (payload: { email: string; role: 'developer' | 'manager' }) =>
    apiClient.post<{ invitation: Invitation; inviteToken: string }>(
      '/invitations',
      payload,
    ),

  listInvitations: () => apiClient.get<Invitation[]>('/invitations'),

  acceptInvitation: (payload: { token: string; name: string; password: string }) =>
    apiClient.post<OrgUser>('/invitations/accept', payload),

  revokeInvitation: (invitationId: string) =>
    apiClient.post<Invitation>(`/invitations/${invitationId}/revoke`),

  getProfile: () => apiClient.get<Profile>('/profile'),

  updateProfile: (payload: Partial<OrgUser>) =>
    apiClient.patch<OrgUser>('/profile', payload),

  listNotifications: (limit = 50) =>
    apiClient.get<{ items: AppNotification[]; unreadCount: number }>(
      `/notifications?limit=${limit}`,
    ),

  markNotificationRead: (id: string) =>
    apiClient.post<AppNotification>(`/notifications/${id}/read`),

  markAllNotificationsRead: () =>
    apiClient.post<{ count: number }>('/notifications/read-all'),

  listAuditLogs: (limit = 100) =>
    apiClient.get<AuditLog[]>(`/audit-logs?limit=${limit}`),

  listTimeline: (limit = 50) =>
    apiClient.get<TimelineEvent[]>(`/timeline?limit=${limit}`),
};

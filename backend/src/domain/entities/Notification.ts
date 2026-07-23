export const NotificationType = {
  REPORT_GENERATED: 'report_generated',
  EMAIL_FAILED: 'email_failed',
  REPOSITORY_SCAN_FAILED: 'repository_scan_failed',
  INVITATION_ACCEPTED: 'invitation_accepted',
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export interface Notification {
  id: string;
  organizationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  meta?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

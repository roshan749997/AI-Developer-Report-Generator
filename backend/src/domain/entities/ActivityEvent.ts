export const ActivityEventType = {
  PROJECT_CREATED: 'project_created',
  REPOSITORY_SCANNED: 'repository_scanned',
  REPORT_GENERATED: 'report_generated',
  EMAIL_SENT: 'email_sent',
  USER_JOINED: 'user_joined',
} as const;

export type ActivityEventType =
  (typeof ActivityEventType)[keyof typeof ActivityEventType];

export interface ActivityEvent {
  id: string;
  organizationId: string;
  actorUserId?: string | null;
  type: ActivityEventType;
  title: string;
  description?: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

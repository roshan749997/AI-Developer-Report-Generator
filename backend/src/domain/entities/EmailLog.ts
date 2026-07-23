export const EmailLogStatus = {
  SENT: 'sent',
  FAILED: 'failed',
} as const;

export type EmailLogStatus = (typeof EmailLogStatus)[keyof typeof EmailLogStatus];

export interface EmailLog {
  id: string;
  projectId: string;
  reportId: string;
  recipient: string;
  subject: string;
  status: EmailLogStatus;
  error: string | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

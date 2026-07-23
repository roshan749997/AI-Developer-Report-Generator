import type { EmailLog, EmailLogStatus } from '../entities/EmailLog.js';

export interface CreateEmailLogInput {
  projectId: string;
  reportId: string;
  recipient: string;
  subject: string;
  status: EmailLogStatus;
  error?: string | null;
  sentAt?: Date | null;
}

export interface IEmailLogRepository {
  create(input: CreateEmailLogInput): Promise<EmailLog>;
  createMany(inputs: CreateEmailLogInput[]): Promise<EmailLog[]>;
  listLatest(limit?: number): Promise<EmailLog[]>;
}

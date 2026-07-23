import { Types } from 'mongoose';
import type {
  CreateEmailLogInput,
  IEmailLogRepository,
} from '../../../domain/repositories/IEmailLogRepository.js';
import type { EmailLog } from '../../../domain/entities/EmailLog.js';
import {
  EmailLogModel,
  type EmailLogDocument,
} from '../models/EmailLogModel.js';

function mapLog(doc: EmailLogDocument): EmailLog {
  return {
    id: doc._id.toString(),
    projectId: doc.projectId.toString(),
    reportId: doc.reportId.toString(),
    recipient: doc.recipient,
    subject: doc.subject,
    status: doc.status as EmailLog['status'],
    error: doc.error ?? null,
    sentAt: doc.sentAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongoEmailLogRepository implements IEmailLogRepository {
  async create(input: CreateEmailLogInput): Promise<EmailLog> {
    const created = await EmailLogModel.create({
      projectId: new Types.ObjectId(input.projectId),
      reportId: new Types.ObjectId(input.reportId),
      recipient: input.recipient.toLowerCase(),
      subject: input.subject,
      status: input.status,
      error: input.error ?? null,
      sentAt: input.sentAt ?? null,
    });
    return mapLog(created);
  }

  async createMany(inputs: CreateEmailLogInput[]): Promise<EmailLog[]> {
    if (inputs.length === 0) {
      return [];
    }

    const created = await EmailLogModel.insertMany(
      inputs.map((input) => ({
        projectId: new Types.ObjectId(input.projectId),
        reportId: new Types.ObjectId(input.reportId),
        recipient: input.recipient.toLowerCase(),
        subject: input.subject,
        status: input.status,
        error: input.error ?? null,
        sentAt: input.sentAt ?? null,
      })),
    );

    return created.map((doc) => mapLog(doc as EmailLogDocument));
  }

  async listLatest(limit = 50): Promise<EmailLog[]> {
    const docs = await EmailLogModel.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
    return docs.map(mapLog);
  }
}

export const emailLogRepository = new MongoEmailLogRepository();

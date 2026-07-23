import { Types } from 'mongoose';
import type {
  CreateAuditLogInput,
  IAuditLogRepository,
} from '../../../domain/repositories/IAuditLogRepository.js';
import type { AuditLog } from '../../../domain/entities/AuditLog.js';
import { AuditLogModel, type AuditLogDocument } from '../models/AuditLogModel.js';

function mapAudit(doc: AuditLogDocument): AuditLog {
  return {
    id: doc._id.toString(),
    organizationId: doc.organizationId ? doc.organizationId.toString() : null,
    userId: doc.userId.toString(),
    userEmail: doc.userEmail,
    action: doc.action,
    resourceType: doc.resourceType ?? null,
    resourceId: doc.resourceId ?? null,
    ip: doc.ip ?? null,
    userAgent: doc.userAgent ?? null,
    meta: doc.meta ?? {},
    createdAt: doc.createdAt,
  };
}

export class MongoAuditLogRepository implements IAuditLogRepository {
  async create(input: CreateAuditLogInput): Promise<AuditLog> {
    const created = await AuditLogModel.create({
      organizationId: input.organizationId
        ? new Types.ObjectId(input.organizationId)
        : null,
      userId: new Types.ObjectId(input.userId),
      userEmail: input.userEmail,
      action: input.action,
      resourceType: input.resourceType ?? null,
      resourceId: input.resourceId ?? null,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
      meta: input.meta ?? {},
    });
    return mapAudit(created);
  }

  async listByOrganization(
    organizationId: string,
    limit = 100,
  ): Promise<AuditLog[]> {
    const docs = await AuditLogModel.find({ organizationId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
    return docs.map(mapAudit);
  }
}

export const auditLogRepository = new MongoAuditLogRepository();

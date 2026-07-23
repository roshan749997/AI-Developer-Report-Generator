import type { AuditLog } from '../entities/AuditLog.js';

export interface CreateAuditLogInput {
  organizationId?: string | null;
  userId: string;
  userEmail: string;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  meta?: Record<string, unknown>;
}

export interface IAuditLogRepository {
  create(input: CreateAuditLogInput): Promise<AuditLog>;
  listByOrganization(organizationId: string, limit?: number): Promise<AuditLog[]>;
}

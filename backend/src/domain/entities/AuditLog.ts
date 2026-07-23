export interface AuditLog {
  id: string;
  organizationId?: string | null;
  userId: string;
  userEmail: string;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

import type { Request } from 'express';
import { auditLogRepository } from '../../../infrastructure/database/repositories/MongoAuditLogRepository.js';
import { logger } from '../../../infrastructure/logger/index.js';

/**
 * Fire-and-forget audit logger. Never blocks the request path.
 */
export function recordAudit(
  req: Request,
  action: string,
  options: {
    resourceType?: string;
    resourceId?: string;
    meta?: Record<string, unknown>;
  } = {},
): void {
  const user = req.user;
  if (!user) return;

  void auditLogRepository
    .create({
      organizationId: user.organizationId ?? null,
      userId: user.id,
      userEmail: user.email,
      action,
      resourceType: options.resourceType ?? null,
      resourceId: options.resourceId ?? null,
      ip: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
      meta: options.meta,
    })
    .catch((error: unknown) => {
      logger.warn({ err: error, action }, 'Failed to write audit log');
    });
}

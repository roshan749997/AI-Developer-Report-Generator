import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../../../domain/entities/User.js';
import {
  type Permission,
  roleHasPermission,
} from '../../../domain/rbac/permissions.js';
import { jwtTokenService } from '../../../infrastructure/security/index.js';
import { ForbiddenError, UnauthorizedError } from '../../../shared/errors/index.js';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  organizationId?: string | null;
}

/**
 * Requires a valid Bearer access token.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedError('Missing access token');
    }

    const payload = jwtTokenService.verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      organizationId: payload.organizationId ?? null,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Restricts access to one or more roles.
 * Must run after `authenticate`.
 */
export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      next(new ForbiddenError('You do not have permission to perform this action'));
      return;
    }

    next();
  };
}

/**
 * Fine-grained RBAC permission check.
 * Must run after `authenticate`.
 */
export function requirePermission(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    const allowed = permissions.every((permission) =>
      roleHasPermission(req.user!.role, permission),
    );

    if (!allowed) {
      next(new ForbiddenError('Insufficient permissions for this action'));
      return;
    }

    next();
  };
}

/**
 * Requires the authenticated user to belong to an organization.
 */
export function requireOrganization(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new UnauthorizedError('Authentication required'));
    return;
  }

  if (!req.user.organizationId) {
    next(
      new ForbiddenError(
        'Organization required. Create or join an organization to use this feature.',
      ),
    );
    return;
  }

  next();
}

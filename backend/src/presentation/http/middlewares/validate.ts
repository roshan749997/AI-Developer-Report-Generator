import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { ValidationError } from '../../../shared/errors/index.js';

type RequestTarget = 'body' | 'query' | 'params';

interface ValidateOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

function parseTarget(schema: ZodSchema, target: RequestTarget, value: unknown) {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new ValidationError(`Invalid request ${target}`, {
      target,
      issues: result.error.flatten(),
    });
  }

  return result.data;
}

/**
 * Zod-based request validation middleware.
 * Validates body, query, and/or params against provided schemas.
 */
export function validate(schemas: ValidateOptions) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = parseTarget(schemas.body, 'body', req.body);
      }

      if (schemas.query) {
        const parsed = parseTarget(schemas.query, 'query', req.query);
        // Replace query with parsed/coerced values (booleans, etc.).
        for (const key of Object.keys(req.query)) {
          delete (req.query as Record<string, unknown>)[key];
        }
        Object.assign(req.query, parsed);
      }

      if (schemas.params) {
        req.params = parseTarget(schemas.params, 'params', req.params) as Request['params'];
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

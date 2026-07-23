import type { NextFunction, Request, Response } from 'express';
import { Error as MongooseError } from 'mongoose';
import { ZodError } from 'zod';
import { env } from '../../../config/env.js';
import { logger } from '../../../infrastructure/logger/index.js';
import { HttpStatus } from '../../../shared/constants/httpStatus.js';
import { AppError, ErrorCode } from '../../../shared/errors/index.js';
import { ApiResponse } from '../response/index.js';

function resolveError(error: unknown): {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
  isOperational: boolean;
} {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details,
      isOperational: error.isOperational,
    };
  }

  if (error instanceof ZodError) {
    return {
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Validation failed',
      details: error.flatten(),
      isOperational: true,
    };
  }

  if (error instanceof MongooseError.CastError) {
    return {
      statusCode: HttpStatus.BAD_REQUEST,
      code: ErrorCode.BAD_REQUEST,
      message: `Invalid ${error.path || 'id'}`,
      isOperational: true,
    };
  }

  if (error instanceof SyntaxError) {
    return {
      statusCode: HttpStatus.BAD_REQUEST,
      code: ErrorCode.BAD_REQUEST,
      message: 'Malformed JSON payload',
      isOperational: true,
    };
  }

  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    code: ErrorCode.INTERNAL_ERROR,
    message:
      env.NODE_ENV === 'production' ? 'Internal server error' : (error as Error)?.message || 'Internal server error',
    isOperational: false,
  };
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(
    new AppError(`Route not found: ${req.method} ${req.originalUrl}`, {
      statusCode: HttpStatus.NOT_FOUND,
      code: ErrorCode.NOT_FOUND,
    }),
  );
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const resolved = resolveError(error);

  if (resolved.isOperational) {
    logger.warn(
      {
        err: error,
        path: req.originalUrl,
        method: req.method,
        code: resolved.code,
      },
      resolved.message,
    );
  } else {
    logger.error(
      {
        err: error,
        path: req.originalUrl,
        method: req.method,
        code: resolved.code,
      },
      'Unhandled error',
    );
  }

  if (res.headersSent) {
    return;
  }

  ApiResponse.error(res, {
    statusCode: resolved.statusCode as (typeof HttpStatus)[keyof typeof HttpStatus],
    message: resolved.message,
    code: resolved.code,
    details: resolved.details,
    path: req.originalUrl,
  });
}

import { HttpStatus, type HttpStatusCode } from '../constants/httpStatus.js';
import { ErrorCode } from './errorCodes.js';

export type ErrorDetails = Record<string, unknown> | unknown[] | undefined;

export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: ErrorDetails;

  constructor(
    message: string,
    options: {
      statusCode?: HttpStatusCode;
      code?: ErrorCode;
      isOperational?: boolean;
      details?: ErrorDetails;
      cause?: unknown;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'AppError';
    this.statusCode = options.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR;
    this.code = options.code ?? ErrorCode.INTERNAL_ERROR;
    this.isOperational = options.isOperational ?? true;
    this.details = options.details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: ErrorDetails) {
    super(message, {
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      code: ErrorCode.VALIDATION_ERROR,
      details,
    });
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: ErrorDetails) {
    super(message, {
      statusCode: HttpStatus.NOT_FOUND,
      code: ErrorCode.NOT_FOUND,
      details,
    });
    this.name = 'NotFoundError';
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: ErrorDetails) {
    super(message, {
      statusCode: HttpStatus.BAD_REQUEST,
      code: ErrorCode.BAD_REQUEST,
      details,
    });
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details?: ErrorDetails) {
    super(message, {
      statusCode: HttpStatus.UNAUTHORIZED,
      code: ErrorCode.UNAUTHORIZED,
      details,
    });
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details?: ErrorDetails) {
    super(message, {
      statusCode: HttpStatus.FORBIDDEN,
      code: ErrorCode.FORBIDDEN,
      details,
    });
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', details?: ErrorDetails) {
    super(message, {
      statusCode: HttpStatus.CONFLICT,
      code: ErrorCode.CONFLICT,
      details,
    });
    this.name = 'ConflictError';
  }
}

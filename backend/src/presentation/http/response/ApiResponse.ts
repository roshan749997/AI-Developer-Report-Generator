import type { Response } from 'express';
import type { HttpStatusCode } from '../../../shared/constants/httpStatus.js';
import { HttpStatus } from '../../../shared/constants/httpStatus.js';

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  details?: unknown;
  path?: string;
  timestamp: string;
}

export class ApiResponse {
  static success<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode: HttpStatusCode = HttpStatus.OK,
    meta?: Record<string, unknown>,
  ): Response {
    const body: ApiSuccessResponse<T> = {
      success: true,
      message,
      data,
      ...(meta ? { meta } : {}),
    };

    return res.status(statusCode).json(body);
  }

  static created<T>(
    res: Response,
    data: T,
    message = 'Created',
    meta?: Record<string, unknown>,
  ): Response {
    return ApiResponse.success(res, data, message, HttpStatus.CREATED, meta);
  }

  static noContent(res: Response): Response {
    return res.status(HttpStatus.NO_CONTENT).send();
  }

  static error(
    res: Response,
    options: {
      statusCode: HttpStatusCode;
      message: string;
      code: string;
      details?: unknown;
      path?: string;
    },
  ): Response {
    const body: ApiErrorResponse = {
      success: false,
      message: options.message,
      code: options.code,
      timestamp: new Date().toISOString(),
      ...(options.details !== undefined ? { details: options.details } : {}),
      ...(options.path ? { path: options.path } : {}),
    };

    return res.status(options.statusCode).json(body);
  }
}

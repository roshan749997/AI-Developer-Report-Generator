import type { Request, Response } from 'express';
import { jobsService } from '../../../application/services/jobs/index.js';
import { UnauthorizedError } from '../../../shared/errors/index.js';
import { ApiResponse } from '../response/index.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  return req.user;
}

export class JobsController {
  status = async (req: Request, res: Response) => {
    requireUser(req);
    const status = await jobsService.getStatus();
    return ApiResponse.success(res, status, 'Scheduler status retrieved');
  };

  logs = async (req: Request, res: Response) => {
    requireUser(req);
    const limit = Number((req.query as { limit?: string }).limit ?? 50);
    const logs = await jobsService.getLogs(Number.isFinite(limit) ? limit : 50);
    return ApiResponse.success(res, logs, 'Scheduler logs retrieved', 200, {
      total: logs.length,
    });
  };

  run = async (req: Request, res: Response) => {
    requireUser(req);
    const result = await jobsService.runNow();
    return ApiResponse.success(res, result, 'Daily report job triggered');
  };
}

export const jobsController = new JobsController();

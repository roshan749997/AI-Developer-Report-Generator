import type { Request, Response } from 'express';
import { getDashboardSummaryService } from '../../../application/services/activity/index.js';
import { UnauthorizedError } from '../../../shared/errors/index.js';
import { ApiResponse } from '../response/index.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  return req.user;
}

export class DashboardController {
  summary = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const summary = await getDashboardSummaryService.execute(user);
    return ApiResponse.success(res, summary, 'Dashboard summary retrieved');
  };
}

export const dashboardController = new DashboardController();

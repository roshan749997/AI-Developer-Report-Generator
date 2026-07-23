import type { Request, Response } from 'express';
import {
  scanProjectActivityService,
  getProjectActivityService,
} from '../../../application/services/activity/index.js';
import { UnauthorizedError } from '../../../shared/errors/index.js';
import { ApiResponse } from '../response/index.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  return req.user;
}

export class ActivityController {
  scan = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const result = await scanProjectActivityService.execute({
      projectId: req.params.projectId!,
      actor: user,
    });

    return ApiResponse.success(res, result, 'Repository scan completed');
  };

  todayActivity = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const result = await getProjectActivityService.execute(
      req.params.projectId!,
      user,
    );

    return ApiResponse.success(res, result, "Today's activity retrieved", 200, {
      total: result.total,
    });
  };
}

export const activityController = new ActivityController();

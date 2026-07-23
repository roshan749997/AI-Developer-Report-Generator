import type { Request, Response } from 'express';
import {
  generateAiReportUseCase,
  listAiReportsUseCase,
  getAiReportUseCase,
} from '../../../application/use-cases/ai/index.js';
import { UnauthorizedError } from '../../../shared/errors/index.js';
import { ApiResponse } from '../response/index.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  return req.user;
}

export class AiController {
  generate = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const body = req.body as {
      todayOnly?: boolean;
      fromDate?: string;
      toDate?: string;
      commitLimit?: number;
      previousReportsLimit?: number;
    };

    const report = await generateAiReportUseCase.execute({
      projectId: req.params.projectId!,
      actor: user,
      todayOnly: body.todayOnly,
      fromDate: body.fromDate ? new Date(body.fromDate) : undefined,
      toDate: body.toDate ? new Date(body.toDate) : undefined,
      commitLimit: body.commitLimit,
      previousReportsLimit: body.previousReportsLimit,
    });

    return ApiResponse.created(res, report, 'AI report generated');
  };

  list = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const limit = Number((req.query as { limit?: string }).limit ?? 50);
    const reports = await listAiReportsUseCase.execute(
      req.params.projectId!,
      user,
      Number.isFinite(limit) ? limit : 50,
    );
    return ApiResponse.success(res, reports, 'AI reports retrieved');
  };

  getById = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const report = await getAiReportUseCase.execute(req.params.reportId!, user);
    return ApiResponse.success(res, report, 'AI report retrieved');
  };
}

export const aiController = new AiController();

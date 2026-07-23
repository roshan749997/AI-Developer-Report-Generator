import type { Request, Response } from 'express';
import { sendReportEmailService } from '../../../application/services/email/index.js';
import { UnauthorizedError } from '../../../shared/errors/index.js';
import { ApiResponse } from '../response/index.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  return req.user;
}

export class EmailController {
  sendReport = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const body = req.body as { recipients: string[] };

    const result = await sendReportEmailService.execute({
      reportId: req.params.reportId!,
      recipients: body.recipients,
      actor: user,
    });

    return ApiResponse.success(res, result, 'Report email sent');
  };

  logs = async (req: Request, res: Response) => {
    requireUser(req);
    const limit = Number((req.query as { limit?: string }).limit ?? 50);
    const logs = await sendReportEmailService.listLogs(
      Number.isFinite(limit) ? limit : 50,
    );
    return ApiResponse.success(res, logs, 'Email logs retrieved', 200, {
      total: logs.length,
    });
  };
}

export const emailController = new EmailController();
